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
const downloadAllHref = '/audio/Stockdale Christian School Band Compilation 1997-2011.zip'

const tracksHtml = data.tracks
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
      <header class="track-header">
        <div class="track-header-row">
          ${thumbBlock}
          <div class="track-header-main">
            <h2 class="track-title">${escapeHtml(t.title)}</h2>
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
        </div>
        <span class="player-time" id="player-duration" aria-hidden="true">0:00</span>
      </div>
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
const playerCurrentTime = requiredEl<'span'>('#player-current-time')
const playerDuration = requiredEl<'span'>('#player-duration')
let playerWaveBars: HTMLElement[] = []
const playButtons = root.querySelectorAll<HTMLButtonElement>('.track-cover-play-btn')
const trackCapsules = root.querySelectorAll<HTMLElement>('.track-capsule')
let isSeeking = false
let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let analyserData: Uint8Array<ArrayBuffer> | null = null
let rafId: number | null = null

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
  if (!isSeeking) {
    const nextValue = duration > 0 ? Math.round((current / duration) * 1000) : 0
    playerSeek.value = String(nextValue)
  }
  playerCurrentTime.textContent = formatTime(current)
  playerDuration.textContent = formatTime(duration)
}

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
  const hasTracks = data.tracks.length > 0

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
    btn.dataset.trackState =
      isCurrent && phase === 'playing' ? 'pause' : isCurrent && phase === 'loading' ? 'loading' : 'play'
    btn.setAttribute('aria-label', label)
    btn.setAttribute('aria-pressed', isCurrent && phase === 'playing' ? 'true' : 'false')
    btn.setAttribute('aria-busy', isCurrent && phase === 'loading' ? 'true' : 'false')
  })

  if (currentIndex >= 0 && data.tracks[currentIndex]) {
    const t = data.tracks[currentIndex]
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
  playerNext.disabled = !hasTracks || currentIndex < 0 || currentIndex >= data.tracks.length - 1
  playerDownloadAll.setAttribute('aria-disabled', hasTracks ? 'false' : 'true')
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
    void resumeAudioContext()
    const raw = btn.dataset.trackIndex
    const index = raw === undefined ? NaN : Number.parseInt(raw, 10)
    if (Number.isNaN(index)) return
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
  if (data.tracks.length > 0) {
    controller.selectTrackAndPlay(0)
  }
})

playerPrev.addEventListener('click', () => {
  void resumeAudioContext()
  const { currentIndex } = controller.getState()
  if (currentIndex > 0) {
    controller.selectTrackAndPlay(currentIndex - 1)
  }
})

playerNext.addEventListener('click', () => {
  void resumeAudioContext()
  const { currentIndex } = controller.getState()
  if (currentIndex >= 0 && currentIndex < data.tracks.length - 1) {
    controller.selectTrackAndPlay(currentIndex + 1)
  } else if (currentIndex < 0 && data.tracks.length > 0) {
    controller.selectTrackAndPlay(0)
  }
})

playerVolume.addEventListener('input', () => {
  const pct = Number(playerVolume.value)
  const clamped = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 100
  const volume = clamped / 100
  audioEl.volume = volume
  audioEl.muted = volume === 0
})

playerVolumeToggle.addEventListener('click', () => {
  const opening = playerVolumePopover.hidden
  playerVolumePopover.hidden = !opening
  playerVolumeToggle.setAttribute('aria-expanded', opening ? 'true' : 'false')
  playerVolumeToggle.setAttribute('aria-label', opening ? 'Hide volume control' : 'Show volume control')
  if (opening) {
    playerVolume.focus()
  }
})

document.addEventListener('pointerdown', (event) => {
  if (playerVolumePopover.hidden) return
  const target = event.target
  if (!(target instanceof Node)) return
  if (playerVolumeWrap.contains(target)) return
  playerVolumePopover.hidden = true
  playerVolumeToggle.setAttribute('aria-expanded', 'false')
  playerVolumeToggle.setAttribute('aria-label', 'Show volume control')
})

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return
  if (playerVolumePopover.hidden) return
  playerVolumePopover.hidden = true
  playerVolumeToggle.setAttribute('aria-expanded', 'false')
  playerVolumeToggle.setAttribute('aria-label', 'Show volume control')
  playerVolumeToggle.focus()
})

audioEl.addEventListener('loadedmetadata', syncPlayerFromAudio)
audioEl.addEventListener('timeupdate', syncPlayerFromAudio)
audioEl.addEventListener('ended', syncPlayerFromAudio)
audioEl.addEventListener('durationchange', syncPlayerFromAudio)

playerSeek.addEventListener('pointerdown', () => {
  isSeeking = true
})

playerSeek.addEventListener('pointerup', () => {
  isSeeking = false
  syncPlayerFromAudio()
})

playerSeek.addEventListener('input', () => {
  if (!Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return
  const ratio = Number(playerSeek.value) / 1000
  const nextTime = Math.max(0, Math.min(audioEl.duration, ratio * audioEl.duration))
  audioEl.currentTime = nextTime
  syncPlayerFromAudio()
})

syncPlayerFromAudio()
buildWaveBars()
resetWaveBars()
audioEl.volume = 1
audioEl.muted = false

window.addEventListener('resize', () => {
  const wasRunning = rafId !== null
  stopWaveformLoop()
  buildWaveBars()
  if (wasRunning) {
    startWaveformLoop()
  }
})
