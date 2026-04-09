import { albumManifest } from 'virtual:album-manifest'

import type { AlbumManifest } from './types/album'

/** Processed manifest from the build pipeline (Markdown → sanitized HTML). */
export function getAlbumManifest(): AlbumManifest {
  return albumManifest
}

/** Async loader; resolves to the same manifest as `getAlbumManifest` (for call sites that expect a Promise). */
export async function loadAlbumManifest(): Promise<AlbumManifest> {
  return albumManifest
}
