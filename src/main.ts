import './style.css'

import { createPlaylistController, type PlaybackState } from './audioEngine'
import { getAlbumManifest } from './loadAlbum'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, '&#39;')
}

/** Resolve `href` against the page; used to decide if the `download` attribute may apply. */
function isSameOriginHref(href: string): boolean {
  try {
    const u = new URL(href, window.location.href)
    return u.origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * Per-track download target: explicit `downloadUrl` when set, else streaming `audioUrl`.
 * The `download` attribute is honored for same-origin URLs; cross-origin links typically
 * open or save according to the browser and `Content-Disposition`, not forced filename.
 */
function getTrackDownloadHref(track: { audioUrl: string; downloadUrl?: string }): string {
  return track.downloadUrl ?? track.audioUrl
}

const root = document.querySelector<HTMLDivElement>('#app')
if (!root) {
  throw new Error('Missing #app mount')
}

const data = getAlbumManifest()

const tracksHtml = data.tracks
  .map((t, index) => {
    const downloadHref = getTrackDownloadHref(t)
    const downloadAttr = isSameOriginHref(downloadHref) ? ' download' : ''
    const thumbBlock = t.coverUrl
      ? `<div class="track-thumb-wrap">
          <img
            class="track-thumb"
            src="${escapeAttr(t.coverUrl)}"
            alt=""
            width="96"
            height="96"
            loading="lazy"
            decoding="async"
          />
        </div>`
      : ''
    return `
    <article class="track-capsule" id="${escapeAttr(t.slug)}">
      <header class="track-header">
        <div class="track-header-row">
          ${thumbBlock}
          <div class="track-header-main">
            <h2 class="track-title">${escapeHtml(t.title)}</h2>
            <div class="track-actions">
              <button
                type="button"
                class="track-play-btn"
                data-track-index="${index}"
                aria-label="Play ${escapeAttr(t.title)}"
              >
                Play
              </button>
              <a
                class="track-download-link"
                href="${escapeAttr(downloadHref)}"${downloadAttr}
                aria-label="Download ${escapeAttr(t.title)}"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      </header>
      <div class="track-story prose">${t.storyHtml}</div>
    </article>`
  })
  .join('')

const heroSubtitle = data.album.subtitle
  ? `<p class="hero-subtitle">${escapeHtml(data.album.subtitle)}</p>`
  : ''
const heroEra = data.album.era ? `<p class="hero-era">${escapeHtml(data.album.era)}</p>` : ''

root.innerHTML = `
  <div class="embed-shell">
    <header class="hero" role="banner" aria-labelledby="album-title">
      <div class="hero-visual">
        <img
          class="hero-img"
          src="${escapeAttr(data.album.heroImageUrl)}"
          alt="${escapeAttr(`${data.album.title} — cover artwork`)}"
          width="1200"
          height="630"
          loading="eager"
          decoding="async"
        />
        <div class="hero-scrim" aria-hidden="true"></div>
        <div class="hero-content">
          <h1 id="album-title" class="hero-title">${escapeHtml(data.album.title)}</h1>
          ${heroSubtitle}
          ${heroEra}
        </div>
      </div>
    </header>
    <main class="embed-main" id="main">
      <div
        class="audio-error-banner"
        id="audio-error-banner"
        role="alert"
        aria-live="assertive"
        hidden
      ></div>
      <div id="now-playing-live" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>
      <section class="album-story-section" aria-label="Album story">
        <div class="album-story-body prose">${data.album.storyHtml}</div>
      </section>
      <section class="tracks-section" aria-label="Tracks">
        ${tracksHtml}
      </section>
    </main>
    <audio
      id="album-audio"
      class="album-audio-el"
      preload="metadata"
      playsinline
      aria-hidden="true"
    ></audio>
  </div>
`

function requiredEl<K extends keyof HTMLElementTagNameMap>(
  selector: string,
): HTMLElementTagNameMap[K] {
  const el = document.querySelector(selector)
  if (!el) {
    throw new Error(`Missing required element: ${selector}`)
  }
  return el as HTMLElementTagNameMap[K]
}

const audioEl = requiredEl<'audio'>('#album-audio')
const errorBanner = requiredEl<'div'>('#audio-error-banner')
const nowPlayingLive = requiredEl<'div'>('#now-playing-live')
const playButtons = root.querySelectorAll<HTMLButtonElement>('.track-play-btn')
const trackCapsules = root.querySelectorAll<HTMLElement>('.track-capsule')

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scrollActiveTrackIntoView(index: number): void {
  const slug = data.tracks[index]?.slug
  if (!slug) return
  const el = document.getElementById(slug)
  if (!el) return
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'nearest',
  })
}

function applyPlaybackUi(state: PlaybackState): void {
  const { phase, currentIndex, errorMessage: err } = state

  if (err) {
    errorBanner.hidden = false
    errorBanner.textContent = err
  } else {
    errorBanner.hidden = true
    errorBanner.textContent = ''
  }

  trackCapsules.forEach((capsule, i) => {
    capsule.classList.toggle('track-capsule--active', i === currentIndex && currentIndex >= 0)
  })

  playButtons.forEach((btn, i) => {
    const title = data.tracks[i]?.title ?? ''
    const isCurrent = i === currentIndex && currentIndex >= 0
    const label =
      isCurrent && phase === 'playing'
        ? `Pause ${title}`
        : isCurrent && phase === 'loading'
          ? `Loading ${title}`
          : `Play ${title}`
    btn.textContent =
      isCurrent && phase === 'playing' ? 'Pause' : isCurrent && phase === 'loading' ? 'Loading…' : 'Play'
    btn.setAttribute('aria-label', label)
    btn.setAttribute('aria-pressed', isCurrent && phase === 'playing' ? 'true' : 'false')
    btn.setAttribute('aria-busy', isCurrent && phase === 'loading' ? 'true' : 'false')
  })

  if (currentIndex >= 0 && data.tracks[currentIndex]) {
    const t = data.tracks[currentIndex]
    const status =
      phase === 'playing'
        ? `Now playing: ${t.title}`
        : phase === 'paused'
          ? `Paused: ${t.title}`
          : phase === 'loading'
            ? `Loading: ${t.title}`
            : phase === 'ended'
              ? `Finished: ${t.title}`
              : phase === 'error'
                ? `Playback error: ${t.title}`
                : ''
    if (status) {
      nowPlayingLive.textContent = status
    }
  } else {
    nowPlayingLive.textContent = ''
  }
}

const controller = createPlaylistController(data.tracks, audioEl, {
  onStateChange: applyPlaybackUi,
  onActiveTrackChange(index, reason) {
    if (reason === 'auto') {
      scrollActiveTrackIntoView(index)
    }
  },
})

playButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const raw = btn.dataset.trackIndex
    const index = raw === undefined ? NaN : Number.parseInt(raw, 10)
    if (Number.isNaN(index)) return
    controller.togglePlayForTrack(index)
  })
})
