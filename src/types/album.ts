/** Source manifest: `story` fields are Markdown strings. */
export interface AlbumBlockSource {
  title: string
  subtitle?: string
  era?: string
  heroImageUrl: string
  /** Markdown body for the album / project narrative. */
  story: string
}

export interface TrackSource {
  title: string
  slug: string
  audioUrl: string
  downloadUrl?: string
  /** Duration in seconds (optional; for display later). */
  duration?: number
  coverUrl?: string
  /** Markdown body for this track’s memory / liner notes. */
  story: string
}

export interface AlbumManifestSource {
  album: AlbumBlockSource
  tracks: TrackSource[]
}

/** Build-processed manifest: stories are sanitized HTML for safe `innerHTML`. */
export interface AlbumBlock {
  title: string
  subtitle?: string
  era?: string
  heroImageUrl: string
  storyHtml: string
}

export interface Track {
  title: string
  slug: string
  audioUrl: string
  downloadUrl?: string
  duration?: number
  coverUrl?: string
  storyHtml: string
}

export interface AlbumManifest {
  album: AlbumBlock
  tracks: Track[]
}
