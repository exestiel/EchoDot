import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig, type Plugin } from 'vite'

import { processAlbumManifestJson } from './src/manifest/processAlbumManifest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const albumJsonPath = resolve(__dirname, 'src/content/album.json')
const virtualId = '\0virtual:album-manifest'

function albumManifestPlugin(): Plugin {
  return {
    name: 'album-manifest',
    resolveId(id) {
      if (id === 'virtual:album-manifest') return virtualId
    },
    load(id) {
      if (id !== virtualId) {
        return
      }
      this.addWatchFile(albumJsonPath)
      const jsonText = readFileSync(albumJsonPath, 'utf-8')
      const manifest = processAlbumManifestJson(jsonText)
      return `export const albumManifest = ${JSON.stringify(manifest)}`
    },
  }
}

export default defineConfig({
  base: '/EchoDot/',
  plugins: [albumManifestPlugin()],
})
