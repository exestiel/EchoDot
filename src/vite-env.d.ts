/// <reference types="vite/client" />

declare module 'virtual:album-manifest' {
  import type { AlbumManifest } from './types/album'
  export const albumManifest: AlbumManifest
}
