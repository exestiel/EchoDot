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

const root = document.querySelector<HTMLDivElement>('#app')
if (!root) {
  throw new Error('Missing #app mount')
}

const data = getAlbumManifest()
const baseUrl = import.meta.env.BASE_URL ?? '/'

function withBaseUrl(url: string): string {
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  if (url.startsWith('/')) {
    return `${base}${url.slice(1)}`
  }
  return `${base}${url.replace(/^\.\//, '')}`
}

const album = {
  ...data.album,
  heroImageUrl: withBaseUrl(data.album.heroImageUrl),
}

const tracks = data.tracks.map((t) => ({
  ...t,
  audioUrl: withBaseUrl(t.audioUrl),
  coverUrl: t.coverUrl ? withBaseUrl(t.coverUrl) : undefined,
  downloadUrl: t.downloadUrl ? withBaseUrl(t.downloadUrl) : undefined,
}))

const downloadAllHref = withBaseUrl('/audio/Stockdale Christian School Band Compilation 1997-2011.zip')
const downloadAllAbsoluteUrl = new URL(downloadAllHref, window.location.href).href
const downloadQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=192x192&margin=8&data=${encodeURIComponent(downloadAllAbsoluteUrl)}`
const fallbackAlbumStoryHtml =
  '<p>This compilation preserves performances from the Stockdale Christian School Band era.</p>'
const fallbackTrackStoryHtml = '<p>Tap play to listen to this track.</p>'
const trackStoryHtml = tracks.map((t) => {
  const normalized = t.storyHtml.trim()
  return normalized.length > 0 ? normalized : fallbackTrackStoryHtml
})
const trackIndexHtml = tracks
  .map(
    (t, index) => `<li>
      <button
        type="button"
        class="track-index-link"
        data-jump-index="${index}"
        aria-label="Jump to ${escapeAttr(t.title)}"
      >
        ${escapeHtml(t.title)}
      </button>
    </li>`,
  )
  .join('')

const tracksHtml = tracks
  .map((t, index) => {
    const thumbBlock = t.coverUrl
      ? `<button
          type="button"
          class="track-cover-play-btn"
          data-track-index="${index}"
          data-track-state="play"
          aria-label="Play ${escapeAttr(t.title)}"
          aria-pressed="false"
        >
          <img
            class="track-thumb"
            src="${escapeAttr(t.coverUrl)}"
            alt=""
            width="96"
            height="96"
            loading="lazy"
            decoding="async"
          />
        </button>`
      : ''
    return `
    <article class="track-capsule" id="${escapeAttr(t.slug)}">
      <span class="track-anchor" id="${escapeAttr(`${t.slug}-anchor`)}" aria-hidden="true"></span>
      <header class="track-header">
        <div class="track-header-row">
          ${thumbBlock}
          <div class="track-header-main">
            <h2 class="track-title">${escapeHtml(t.title)}</h2>
          </div>
        </div>
      </header>
      <p class="track-status" id="track-status-${index}" aria-live="polite"></p>
      <div class="track-story prose" data-story-index="${index}">${trackStoryHtml[index]}</div>
    </article>`
  })
  .join('')

const heroSubtitle = album.subtitle
  ? `<p class="hero-subtitle">${escapeHtml(album.subtitle)}</p>`
  : ''
const heroEra = album.era ? `<p class="hero-era">${escapeHtml(album.era)}</p>` : ''

root.innerHTML = `
  <div class="embed-shell">
    <header class="hero" role="banner" aria-labelledby="album-title">
      <div class="hero-visual">
        <img
          class="hero-img"
          src="${escapeAttr(album.heroImageUrl)}"
          alt="${escapeAttr(`${album.title} — cover artwork`)}"
          width="1200"
          height="630"
          loading="eager"
          decoding="async"
        />
        <div class="hero-scrim" aria-hidden="true"></div>
        <div class="hero-content">
          <h1 id="album-title" class="hero-title">${escapeHtml(album.title)}</h1>
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
        <div class="album-story-body prose">${album.storyHtml.trim().length > 0 ? album.storyHtml : fallbackAlbumStoryHtml}</div>
      </section>
      <nav class="track-index" aria-label="Track index">
        <p class="track-index-title">Tracks</p>
        <ol class="track-index-list">
          ${trackIndexHtml}
        </ol>
      </nav>
      <section class="tracks-section" aria-label="Tracks">
        ${tracksHtml}
      </section>
      <footer class="brand-footer" aria-label="Echo Sound Space">
        <div class="brand-footer-qr">
          <a
            class="brand-footer-qr-link"
            href="${escapeAttr(downloadAllHref)}"
            download
            aria-label="Download all tracks"
          >
            <img
              class="brand-footer-qr-image"
              src=""
              data-qr-src="${escapeAttr(downloadQrSrc)}"
              alt="QR code to download all tracks"
              width="144"
              height="144"
              loading="lazy"
              decoding="async"
            />
          </a>
          <p class="brand-footer-qr-caption">Scan to download all tracks</p>
        </div>
        <p class="brand-footer-text">
          Want a page like this?
          <a
            class="brand-footer-link"
            href="https://www.echosound.space"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit our website
          </a>
        </p>
      </footer>
    </main>
    <section class="player-bar" aria-label="Player controls">
      <div class="player-main-row">
        <div class="player-main-spacer" aria-hidden="true"></div>
        <div class="player-transport">
          <button
            type="button"
            id="player-prev"
            class="player-toggle-btn player-nav-btn player-btn--prev"
            aria-label="Previous track"
          ></button>
          <button
            type="button"
            id="player-toggle"
            class="player-toggle-btn player-btn--toggle"
            data-player-state="play"
            aria-label="Play"
            aria-pressed="false"
          ></button>
          <button
            type="button"
            id="player-next"
            class="player-toggle-btn player-nav-btn player-btn--next"
            aria-label="Next track"
          ></button>
        </div>
        <div class="player-volume" id="player-volume-wrap">
          <button
            type="button"
            id="player-volume-toggle"
            class="player-volume-btn"
            aria-label="Show volume control"
            aria-expanded="false"
            aria-controls="player-volume-popover"
          >
            <svg
              class="player-volume-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M11 5 6 9H3v6h3l5 4V5zM15.5 9.5a4 4 0 0 1 0 5M18.5 7a8 8 0 0 1 0 10"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.75"
              />
            </svg>
          </button>
          <div class="player-volume-popover" id="player-volume-popover" hidden>
            <label class="visually-hidden" for="player-volume">Volume</label>
            <input
              id="player-volume"
              class="player-volume-slider"
              type="range"
              min="0"
              max="100"
              value="100"
              step="1"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
      <div class="player-meta-row">
        <button type="button" class="player-jump-current" id="player-jump-current">
          Jump to current track
        </button>
        <p class="player-now-playing" id="player-now-playing">Not playing</p>
        <a
          class="player-download-all"
          href="${escapeAttr(downloadAllHref)}"
          download
          aria-label="Download all tracks"
        >
          Download all
        </a>
      </div>
      <div class="player-scrub-row">
        <span class="player-time" id="player-current-time" aria-hidden="true">0:00</span>
        <div class="player-seek-wrap">
          <div class="player-scrubber-wave" aria-hidden="true">
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
            <span class="player-scrubber-wave-bar"></span>
          </div>
          <input
            id="player-seek"
            class="player-seek"
            type="range"
            min="0"
            max="1000"
            value="0"
            step="1"
            aria-label="Seek playback"
          />
          <span class="player-seek-tooltip" id="player-seek-tooltip" hidden>0:00</span>
        </div>
        <span class="player-time" id="player-duration" aria-hidden="true">0:00</span>
      </div>
      <p class="player-shortcuts-hint">Shortcuts: Space play/pause, J previous, K next, M mute, arrows seek</p>
    </section>
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
const playerPrev = requiredEl<'button'>('#player-prev')
const playerToggle = requiredEl<'button'>('#player-toggle')
const playerNext = requiredEl<'button'>('#player-next')
const playerDownloadAll = requiredEl<'a'>('.player-download-all')
const playerVolumeWrap = requiredEl<'div'>('#player-volume-wrap')
const playerVolumeToggle = requiredEl<'button'>('#player-volume-toggle')
const playerVolumePopover = requiredEl<'div'>('#player-volume-popover')
const playerVolume = requiredEl<'input'>('#player-volume')
const playerNowPlaying = requiredEl<'p'>('#player-now-playing')
const playerScrubberWave = requiredEl<'div'>('.player-scrubber-wave')
const playerSeek = requiredEl<'input'>('#player-seek')
const playerSeekWrap = requiredEl<'div'>('.player-seek-wrap')
const playerSeekTooltip = requiredEl<'span'>('#player-seek-tooltip')
const playerCurrentTime = requiredEl<'span'>('#player-current-time')
const playerDuration = requiredEl<'span'>('#player-duration')
const playerJumpCurrent = requiredEl<'button'>('#player-jump-current')
const trackIndexLinks = root.querySelectorAll<HTMLButtonElement>('.track-index-link')
const trackStatuses = root.querySelectorAll<HTMLParagraphElement>('.track-status')
const qrImage = root.querySelector<HTMLImageElement>('.brand-footer-qr-image')
let playerWaveBars: HTMLElement[] = []
const playButtons = root.querySelectorAll<HTMLButtonElement>('.track-cover-play-btn')
const trackCapsules = root.querySelectorAll<HTMLElement>('.track-capsule')
let isSeeking = false
let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let analyserData: Uint8Array<ArrayBuffer> | null = null
let rafId: number | null = null
let wasMutedBeforeSeek: boolean | null = null
let lastKnownUnmutedVolume = 1
const volumeStorageKey = 'echodot:playerVolume'
const muteStorageKey = 'echodot:playerMuted'
const longStoryIndexes = trackStoryHtml
  .map((html, index) => ({ html, index }))
  .filter((entry) => entry.html.length > 320)
  .map((entry) => entry.index)

function logUxEvent(name: string, detail: Record<string, unknown> = {}): void {
  window.dispatchEvent(new CustomEvent('echodot:ux', { detail: { name, ...detail } }))
  if (import.meta.env.DEV) {
    console.debug('[ux]', name, detail)
  }
}

function calculateWaveBarCount(): number {
  const width = window.innerWidth
  const target = Math.floor(width / 14)
  return Math.max(24, Math.min(112, target))
}

function buildWaveBars(): void {
  const count = calculateWaveBarCount()
  playerScrubberWave.replaceChildren()
  const bars: HTMLElement[] = []
  for (let i = 0; i < count; i += 1) {
    const bar = document.createElement('span')
    bar.className = 'player-scrubber-wave-bar'
    bar.style.setProperty('--wave-scale', '0.7')
    playerScrubberWave.append(bar)
    bars.push(bar)
  }
  playerWaveBars = bars
}

function getCenterOutBarOrder(count: number): number[] {
  if (count <= 0) return []
  const order: number[] = []
  if (count % 2 === 1) {
    const center = Math.floor(count / 2)
    order.push(center)
    for (let offset = 1; offset <= center; offset += 1) {
      order.push(center - offset, center + offset)
    }
    return order
  }

  const leftCenter = count / 2 - 1
  const rightCenter = count / 2
  order.push(leftCenter, rightCenter)
  for (let offset = 1; leftCenter - offset >= 0 && rightCenter + offset < count; offset += 1) {
    order.push(leftCenter - offset, rightCenter + offset)
  }
  return order
}

function resetWaveBars(): void {
  playerWaveBars.forEach((bar) => {
    bar.style.setProperty('--wave-scale', '0.7')
  })
}

function stopWaveformLoop(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  resetWaveBars()
}

function closeVolumePopover({ restoreFocus = false }: { restoreFocus?: boolean } = {}): void {
  playerVolumePopover.hidden = true
  playerVolumeToggle.setAttribute('aria-expanded', 'false')
  playerVolumeToggle.setAttribute('aria-label', 'Show volume control')
  if (restoreFocus) {
    playerVolumeToggle.focus()
  }
}

function updateSeekUi(progress: number): void {
  const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0
  playerSeekWrap.style.setProperty('--seek-progress', clamped.toFixed(4))
}

function updateWaveBarsFromProgress(progress: number): void {
  const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0
  const count = playerWaveBars.length
  playerWaveBars.forEach((bar, index) => {
    if (count <= 1) {
      bar.style.setProperty('--wave-scale', '0.9')
      return
    }
    const ratio = index / (count - 1)
    bar.style.setProperty('--wave-scale', ratio <= clamped ? '1.15' : '0.65')
  })
}

function ensureAudioAnalysis(): void {
  if (audioCtx || !('AudioContext' in window)) return
  try {
    audioCtx = new AudioContext()
    const source = audioCtx.createMediaElementSource(audioEl)
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.72
    source.connect(analyser)
    analyser.connect(audioCtx.destination)
    analyserData = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
  } catch {
    audioCtx = null
    analyser = null
    analyserData = null
  }
}

function startWaveformLoop(): void {
  if (prefersReducedMotion()) {
    stopWaveformLoop()
    return
  }
  if (!analyser || !analyserData || rafId !== null) return
  const barOrder = getCenterOutBarOrder(playerWaveBars.length)
  const tick = () => {
    if (!analyser || !analyserData) return
    const data = analyserData
    analyser.getByteFrequencyData(data)
    const segmentSize = Math.max(1, Math.floor(data.length / Math.max(1, barOrder.length)))
    barOrder.forEach((barIndex, orderIndex) => {
      const bar = playerWaveBars[barIndex]
      if (!bar) return
      const start = orderIndex * segmentSize
      const end = orderIndex === barOrder.length - 1 ? data.length : start + segmentSize
      let total = 0
      for (let j = start; j < end; j += 1) total += data[j]
      const avg = total / Math.max(1, end - start)
      const scale = 0.7 + (avg / 255) * 2.1
      bar.style.setProperty('--wave-scale', scale.toFixed(3))
    })
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

async function resumeAudioContext(): Promise<void> {
  ensureAudioAnalysis()
  if (!audioCtx) return
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume()
  }
}

function readStoredAudioPreference(): { volume: number; muted: boolean } {
  try {
    const rawVolume = window.localStorage.getItem(volumeStorageKey)
    const rawMuted = window.localStorage.getItem(muteStorageKey)
    const volumeParsed = rawVolume === null ? 1 : Number(rawVolume)
    const mutedParsed = rawMuted === null ? false : rawMuted === 'true'
    const volume = Number.isFinite(volumeParsed) ? Math.max(0, Math.min(1, volumeParsed)) : 1
    return { volume, muted: mutedParsed }
  } catch {
    return { volume: 1, muted: false }
  }
}

function writeStoredAudioPreference(volume: number, muted: boolean): void {
  try {
    window.localStorage.setItem(volumeStorageKey, String(volume))
    window.localStorage.setItem(muteStorageKey, String(muted))
  } catch {
    // Ignore storage failures (private mode, blocked storage, etc.)
  }
}

function setAudioVolumeState(nextVolume: number): void {
  const volume = Number.isFinite(nextVolume) ? Math.max(0, Math.min(1, nextVolume)) : 1
  if (volume > 0) {
    lastKnownUnmutedVolume = volume
  }
  audioEl.volume = volume
  audioEl.muted = volume === 0
  playerVolume.value = String(Math.round(volume * 100))
  writeStoredAudioPreference(audioEl.volume, audioEl.muted)
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const rounded = Math.floor(seconds)
  const mins = Math.floor(rounded / 60)
  const secs = rounded % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function syncPlayerFromAudio(): void {
  const duration = Number.isFinite(audioEl.duration) ? audioEl.duration : 0
  const current = Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0
  const progress = duration > 0 ? current / duration : 0
  if (!isSeeking) {
    const nextValue = duration > 0 ? Math.round((current / duration) * 1000) : 0
    playerSeek.value = String(nextValue)
  }
  updateSeekUi(progress)
  if (prefersReducedMotion()) {
    updateWaveBarsFromProgress(progress)
  }
  playerCurrentTime.textContent = formatTime(current)
  playerDuration.textContent = formatTime(duration)
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scrollActiveTrackIntoView(index: number): void {
  const slug = tracks[index]?.slug
  if (!slug) return
  const el = document.getElementById(`${slug}-anchor`) ?? document.getElementById(slug)
  if (!el) return
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'nearest',
  })
}

function jumpTrackIntoView(index: number): void {
  const slug = tracks[index]?.slug
  if (!slug) return
  const el = document.getElementById(`${slug}-anchor`) ?? document.getElementById(slug)
  if (!el) return

  const playerBar = document.querySelector<HTMLElement>('.player-bar')
  const playerHeight = playerBar ? playerBar.getBoundingClientRect().height : 0
  const topMargin = 12
  const bottomMargin = Math.max(12, Math.ceil(playerHeight) + 8)
  const rect = el.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const availableHeight = Math.max(80, viewportHeight - topMargin - bottomMargin)
  const isFullyVisible = rect.top >= topMargin && rect.bottom <= viewportHeight - bottomMargin

  if (isFullyVisible) return

  let targetTop = window.scrollY + rect.top - topMargin
  if (rect.height <= availableHeight) {
    const overflowBelow = rect.bottom - (viewportHeight - bottomMargin)
    if (overflowBelow > 0) {
      targetTop += overflowBelow
    }
  }

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
}

function applyPlaybackUi(state: PlaybackState): void {
  const { phase, currentIndex, errorMessage: err } = state
  const hasTracks = tracks.length > 0

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
  trackIndexLinks.forEach((link, i) => {
    const isCurrent = i === currentIndex && currentIndex >= 0
    link.classList.toggle('track-index-link--active', isCurrent)
    link.setAttribute('aria-current', isCurrent ? 'true' : 'false')
  })
  trackStatuses.forEach((node, i) => {
    const isCurrent = i === currentIndex && currentIndex >= 0
    if (!isCurrent) {
      node.textContent = ''
      return
    }
    if (phase === 'loading') node.textContent = 'Loading audio...'
    else if (phase === 'error' && err) node.textContent = err
    else node.textContent = ''
  })

  playButtons.forEach((btn, i) => {
    const title = tracks[i]?.title ?? ''
    const isCurrent = i === currentIndex && currentIndex >= 0
    const label =
      isCurrent && phase === 'playing'
        ? `Pause ${title}`
        : isCurrent && phase === 'loading'
          ? `Loading ${title}`
          : `Play ${title}`
    btn.dataset.trackState =
      isCurrent && phase === 'playing' ? 'pause' : isCurrent && phase === 'loading' ? 'loading' : 'play'
    btn.setAttribute('aria-label', label)
    btn.setAttribute('aria-pressed', isCurrent && phase === 'playing' ? 'true' : 'false')
    btn.setAttribute('aria-busy', isCurrent && phase === 'loading' ? 'true' : 'false')
  })

  if (currentIndex >= 0 && tracks[currentIndex]) {
    const t = tracks[currentIndex]
    playerNowPlaying.textContent = t.title
    const isPlaying = phase === 'playing'
    if (isPlaying) {
      startWaveformLoop()
    } else {
      stopWaveformLoop()
    }
    playerToggle.dataset.playerState = isPlaying ? 'pause' : 'play'
    playerToggle.setAttribute('aria-label', isPlaying ? `Pause ${t.title}` : `Play ${t.title}`)
    playerToggle.setAttribute('aria-pressed', isPlaying ? 'true' : 'false')
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
    stopWaveformLoop()
    playerToggle.dataset.playerState = 'play'
    playerToggle.setAttribute('aria-label', 'Play')
    playerToggle.setAttribute('aria-pressed', 'false')
    playerNowPlaying.textContent = 'Not playing'
    nowPlayingLive.textContent = ''
  }

  playerPrev.disabled = !hasTracks || currentIndex <= 0
  playerNext.disabled = !hasTracks || currentIndex < 0 || currentIndex >= tracks.length - 1
  playerDownloadAll.setAttribute('aria-disabled', hasTracks ? 'false' : 'true')
}

const controller = createPlaylistController(tracks, audioEl, {
  onStateChange: applyPlaybackUi,
  onActiveTrackChange(index, reason) {
    if (reason === 'auto') {
      scrollActiveTrackIntoView(index)
    }
  },
})

playButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    void resumeAudioContext()
    const raw = btn.dataset.trackIndex
    const index = raw === undefined ? NaN : Number.parseInt(raw, 10)
    if (Number.isNaN(index)) return
    logUxEvent('track_toggle_click', { index, title: tracks[index]?.title ?? '' })
    controller.togglePlayForTrack(index)
  })
})

playerToggle.addEventListener('click', () => {
  void resumeAudioContext()
  const state = controller.getState()
  if (state.currentIndex >= 0) {
    controller.togglePlayForTrack(state.currentIndex)
    return
  }
  if (tracks.length > 0) {
    controller.selectTrackAndPlay(0)
  }
})

playerPrev.addEventListener('click', () => {
  void resumeAudioContext()
  const { currentIndex } = controller.getState()
  if (currentIndex > 0) {
    logUxEvent('player_prev_click', { fromIndex: currentIndex })
    controller.selectTrackAndPlay(currentIndex - 1)
  }
})

playerNext.addEventListener('click', () => {
  void resumeAudioContext()
  const { currentIndex } = controller.getState()
  if (currentIndex >= 0 && currentIndex < tracks.length - 1) {
    logUxEvent('player_next_click', { fromIndex: currentIndex })
    controller.selectTrackAndPlay(currentIndex + 1)
  } else if (currentIndex < 0 && tracks.length > 0) {
    logUxEvent('player_next_click', { fromIndex: currentIndex })
    controller.selectTrackAndPlay(0)
  }
})

playerVolume.addEventListener('input', () => {
  const pct = Number(playerVolume.value)
  const clamped = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 100
  setAudioVolumeState(clamped / 100)
})

playerVolumeToggle.addEventListener('click', () => {
  const opening = playerVolumePopover.hidden
  playerVolumePopover.hidden = !opening
  playerVolumeToggle.setAttribute('aria-expanded', opening ? 'true' : 'false')
  playerVolumeToggle.setAttribute('aria-label', opening ? 'Hide volume control' : 'Show volume control')
  if (opening) {
    playerVolume.focus()
  } else {
    closeVolumePopover()
  }
})

trackIndexLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const raw = link.dataset.jumpIndex
    const index = raw === undefined ? NaN : Number.parseInt(raw, 10)
    if (Number.isNaN(index)) return
    const slug = tracks[index]?.slug
    if (!slug) return
    const capsule = document.getElementById(`${slug}-anchor`) ?? document.getElementById(slug)
    if (!capsule) return
    logUxEvent('track_jump_click', { index, title: tracks[index]?.title ?? '' })
    capsule.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  })
})

playerJumpCurrent.addEventListener('click', () => {
  const { currentIndex } = controller.getState()
  if (currentIndex < 0) return
  jumpTrackIntoView(currentIndex)
  logUxEvent('player_jump_current', { index: currentIndex })
})

document.addEventListener('pointerdown', (event) => {
  if (playerVolumePopover.hidden) return
  const target = event.target
  if (!(target instanceof Node)) return
  if (playerVolumeWrap.contains(target)) return
  closeVolumePopover()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !playerVolumePopover.hidden) {
    closeVolumePopover({ restoreFocus: true })
    return
  }
  if (!playerVolumePopover.hidden && event.key === 'Tab') {
    const first = playerVolume
    const last = playerVolumeToggle
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
      return
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
    return
  }
  const target = event.target
  const isTextInput =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  if (isTextInput) return
  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault()
    playerToggle.click()
  } else if (event.key.toLowerCase() === 'j') {
    event.preventDefault()
    playerPrev.click()
  } else if (event.key.toLowerCase() === 'k') {
    event.preventDefault()
    playerNext.click()
  } else if (event.key.toLowerCase() === 'm') {
    event.preventDefault()
    if (audioEl.muted || audioEl.volume === 0) {
      setAudioVolumeState(lastKnownUnmutedVolume)
    } else {
      setAudioVolumeState(0)
    }
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    audioEl.currentTime = Math.max(0, audioEl.currentTime - 5)
    syncPlayerFromAudio()
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    const duration = Number.isFinite(audioEl.duration) ? audioEl.duration : 0
    audioEl.currentTime = Math.min(duration, audioEl.currentTime + 5)
    syncPlayerFromAudio()
  }
})

playerVolumeWrap.addEventListener('focusout', (event) => {
  if (playerVolumePopover.hidden) return
  const next = event.relatedTarget
  if (next instanceof Node && playerVolumeWrap.contains(next)) return
  closeVolumePopover()
})

audioEl.addEventListener('loadedmetadata', syncPlayerFromAudio)
audioEl.addEventListener('timeupdate', syncPlayerFromAudio)
audioEl.addEventListener('ended', syncPlayerFromAudio)
audioEl.addEventListener('durationchange', syncPlayerFromAudio)

playerSeek.addEventListener('pointerdown', (event) => {
  isSeeking = true
  if (wasMutedBeforeSeek === null) {
    wasMutedBeforeSeek = audioEl.muted
  }
  audioEl.muted = true
  playerSeekTooltip.hidden = false
  if (event.pointerId !== undefined) {
    try {
      playerSeek.setPointerCapture(event.pointerId)
    } catch {
      // Some browsers may reject capture for range controls; ignore.
    }
  }
})

playerSeek.addEventListener('pointerup', () => {
  isSeeking = false
  if (wasMutedBeforeSeek !== null) {
    audioEl.muted = wasMutedBeforeSeek
    wasMutedBeforeSeek = null
  }
  playerSeekTooltip.hidden = true
  syncPlayerFromAudio()
})

playerSeek.addEventListener('pointercancel', () => {
  isSeeking = false
  if (wasMutedBeforeSeek !== null) {
    audioEl.muted = wasMutedBeforeSeek
    wasMutedBeforeSeek = null
  }
  playerSeekTooltip.hidden = true
  syncPlayerFromAudio()
})

playerSeek.addEventListener('lostpointercapture', () => {
  isSeeking = false
  if (wasMutedBeforeSeek !== null) {
    audioEl.muted = wasMutedBeforeSeek
    wasMutedBeforeSeek = null
  }
  playerSeekTooltip.hidden = true
  syncPlayerFromAudio()
})

playerSeek.addEventListener('input', () => {
  if (!Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return
  const ratio = Number(playerSeek.value) / 1000
  const nextTime = Math.max(0, Math.min(audioEl.duration, ratio * audioEl.duration))
  audioEl.currentTime = nextTime
  playerSeekTooltip.textContent = formatTime(nextTime)
  playerSeekTooltip.style.setProperty('--seek-tooltip-progress', String(ratio))
  logUxEvent('seek_input', { ratio })
  syncPlayerFromAudio()
})

playerSeek.addEventListener('change', () => {
  isSeeking = false
  if (wasMutedBeforeSeek !== null) {
    audioEl.muted = wasMutedBeforeSeek
    wasMutedBeforeSeek = null
  }
  playerSeekTooltip.hidden = true
  syncPlayerFromAudio()
})

playerDownloadAll.addEventListener('click', () => {
  logUxEvent('download_all_click', { source: 'player_bar' })
})

function setupLazyTrackStories(): void {
  if (longStoryIndexes.length === 0) return
  const storyNodes = document.querySelectorAll<HTMLElement>('.track-story[data-story-index]')
  const byIndex = new Map<number, HTMLElement>()
  storyNodes.forEach((node) => {
    const raw = node.dataset.storyIndex
    const index = raw === undefined ? NaN : Number.parseInt(raw, 10)
    if (!Number.isNaN(index)) {
      byIndex.set(index, node)
    }
  })
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const node = entry.target
        if (!(node instanceof HTMLElement)) return
        const raw = node.dataset.storyIndex
        const index = raw === undefined ? NaN : Number.parseInt(raw, 10)
        if (Number.isNaN(index)) return
        if (!longStoryIndexes.includes(index)) {
          observer.unobserve(node)
          return
        }
        node.innerHTML = trackStoryHtml[index]
        observer.unobserve(node)
      })
    },
    { rootMargin: '300px 0px' },
  )
  longStoryIndexes.forEach((index) => {
    const node = byIndex.get(index)
    if (!node) return
    node.innerHTML = fallbackTrackStoryHtml
    observer.observe(node)
  })
}

function deferQrImageLoad(): void {
  if (!qrImage) return
  const source = qrImage.dataset.qrSrc
  if (!source) return
  const footer = document.querySelector<HTMLElement>('.brand-footer')
  if (!footer) {
    qrImage.src = source
    return
  }
  const observer = new IntersectionObserver(
    (entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting)
      if (!isVisible) return
      qrImage.src = source
      observer.disconnect()
    },
    { rootMargin: '200px 0px' },
  )
  observer.observe(footer)
}

syncPlayerFromAudio()
buildWaveBars()
resetWaveBars()
setupLazyTrackStories()
deferQrImageLoad()
const storedAudioPreference = readStoredAudioPreference()
setAudioVolumeState(storedAudioPreference.volume)
if (storedAudioPreference.muted) {
  audioEl.muted = true
  writeStoredAudioPreference(audioEl.volume, audioEl.muted)
}

window.addEventListener('resize', () => {
  const wasRunning = rafId !== null
  stopWaveformLoop()
  buildWaveBars()
  if (wasRunning && !prefersReducedMotion()) {
    startWaveformLoop()
  }
})
