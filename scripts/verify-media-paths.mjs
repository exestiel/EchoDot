import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = process.cwd()
const albumPath = resolve(projectRoot, 'src/content/album.json')
const publicRoot = resolve(projectRoot, 'public')
const zipPath = resolve(
  publicRoot,
  'audio/Stockdale Christian School Band Compilation 1997-2011.zip',
)

function toPublicFile(urlPath) {
  if (typeof urlPath !== 'string') return null
  if (!urlPath.startsWith('/')) return null
  if (/^(https?:)?\/\//i.test(urlPath)) return null
  return resolve(publicRoot, `.${urlPath}`)
}

const album = JSON.parse(readFileSync(albumPath, 'utf8'))
const missing = []

const heroPath = toPublicFile(album?.album?.heroImageUrl)
if (heroPath && !existsSync(heroPath)) {
  missing.push(`album.heroImageUrl -> ${album.album.heroImageUrl}`)
}

for (const [index, track] of (album?.tracks ?? []).entries()) {
  const audioFile = toPublicFile(track.audioUrl)
  if (audioFile && !existsSync(audioFile)) {
    missing.push(`tracks[${index}].audioUrl -> ${track.audioUrl}`)
  }
  if (track.coverUrl) {
    const coverFile = toPublicFile(track.coverUrl)
    if (coverFile && !existsSync(coverFile)) {
      missing.push(`tracks[${index}].coverUrl -> ${track.coverUrl}`)
    }
  }
}

if (!existsSync(zipPath)) {
  missing.push('download bundle missing -> /audio/Stockdale Christian School Band Compilation 1997-2011.zip')
}

if (missing.length > 0) {
  console.error('Media path verification failed. Missing files:')
  for (const item of missing) {
    console.error(`- ${item}`)
  }
  process.exit(1)
}

console.log('Media path verification passed.')
