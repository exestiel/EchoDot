import type { Track } from './types/album'

/** High-level playback phase for UI and playlist rules. */
export type PlaybackPhase = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

export interface PlaybackState {
  phase: PlaybackPhase
  /** Selected track index, or -1 before any track has been loaded */
  currentIndex: number
  errorMessage: string | null
}

function mediaErrorMessage(code: number | undefined): string {
  if (code === undefined) return 'Could not play this track.'
  switch (code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'Audio loading was interrupted.'
    case MediaError.MEDIA_ERR_NETWORK:
      return 'Network error while loading audio.'
    case MediaError.MEDIA_ERR_DECODE:
      return 'This audio file could not be decoded.'
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'Audio format or file is not supported.'
    default:
      return 'Could not play this track.'
  }
}

export interface PlaylistControllerHandlers {
  onStateChange: (state: PlaybackState) => void
  /** Fires when the active track index changes (play or auto-advance). */
  onActiveTrackChange?: (index: number, reason: 'user' | 'auto') => void
}

export interface PlaylistController {
  getState(): PlaybackState
  /** Load and play the given track (0-based). */
  selectTrackAndPlay(index: number): void
  /** Play/pause for the track row that was activated; loads if another track is current. */
  togglePlayForTrack(index: number): void
}

/**
 * Single hidden `<audio>` playlist state machine: idle / loading / playing / paused / ended / error.
 * On natural `ended`, advances to the next track or stops on the last track (no loop).
 */
export function createPlaylistController(
  tracks: readonly Pick<Track, 'audioUrl' | 'title'>[],
  audio: HTMLAudioElement,
  handlers: PlaylistControllerHandlers,
): PlaylistController {
  let currentIndex = -1
  let phase: PlaybackPhase = 'idle'
  let errorMessage: string | null = null

  function emit(): void {
    handlers.onStateChange({
      phase,
      currentIndex,
      errorMessage,
    })
  }

  function setPhase(p: PlaybackPhase): void {
    phase = p
    if (p !== 'error') {
      errorMessage = null
    }
    emit()
  }

  function setError(msg: string): void {
    errorMessage = msg
    phase = 'error'
    emit()
  }

  async function loadAndPlay(index: number, reason: 'user' | 'auto'): Promise<void> {
    if (index < 0 || index >= tracks.length) return
    currentIndex = index
    setPhase('loading')
    handlers.onActiveTrackChange?.(index, reason)

    const url = tracks[index].audioUrl
    audio.src = url
    audio.load()
    try {
      await audio.play()
    } catch (e) {
      if (e instanceof DOMException && e.name === 'NotAllowedError') {
        errorMessage = 'Playback was blocked. Tap play again to start.'
        phase = 'paused'
        emit()
      } else {
        setError(e instanceof Error ? e.message : 'Could not start playback.')
      }
    }
  }

  function onEnded(): void {
    if (currentIndex < 0) return
    if (currentIndex < tracks.length - 1) {
      void loadAndPlay(currentIndex + 1, 'auto')
    } else {
      setPhase('ended')
    }
  }

  audio.addEventListener('playing', () => {
    if (currentIndex >= 0) {
      setPhase('playing')
    }
  })

  audio.addEventListener('pause', () => {
    if (currentIndex < 0) return
    if (phase === 'loading') return
    if (phase === 'error') return
    if (audio.ended) return
    setPhase('paused')
  })

  audio.addEventListener('ended', onEnded)

  audio.addEventListener('error', () => {
    setError(mediaErrorMessage(audio.error?.code))
  })

  emit()

  return {
    getState(): PlaybackState {
      return { phase, currentIndex, errorMessage }
    },

    selectTrackAndPlay(index: number): void {
      void loadAndPlay(index, 'user')
    },

    togglePlayForTrack(index: number): void {
      if (index < 0 || index >= tracks.length) return

      if (index !== currentIndex) {
        void loadAndPlay(index, 'user')
        return
      }

      if (phase === 'playing') {
        audio.pause()
        return
      }

      if (phase === 'loading') {
        return
      }

      if (phase === 'paused' || phase === 'ended' || phase === 'error') {
        if (phase === 'ended' || phase === 'error') {
          audio.currentTime = 0
        }
        void audio.play().catch((e) => {
          if (e instanceof DOMException && e.name === 'NotAllowedError') {
            errorMessage = 'Playback was blocked. Tap play again to start.'
            phase = 'paused'
            emit()
          } else {
            setError(e instanceof Error ? e.message : 'Could not start playback.')
          }
        })
      }
    },
  }
}
