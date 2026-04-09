import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const base = process.argv[2]
if (!base) {
  console.error('Usage: node ./scripts/check-pages-media.mjs <pages-base-url>')
  process.exit(1)
}

const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
const albumPath = resolve(process.cwd(), 'src/content/album.json')
const album = JSON.parse(readFileSync(albumPath, 'utf8'))

const sampleTracks = (album.tracks ?? []).slice(0, 3)
const checks = [
  { name: 'site root', url: `${normalizedBase}/` },
  { name: 'download zip', url: `${normalizedBase}/audio/Stockdale Christian School Band Compilation 1997-2011.zip` },
  ...sampleTracks.map((t, i) => ({
    name: `track ${i + 1}`,
    url: `${normalizedBase}${t.audioUrl}`,
    expectAudio: true,
  })),
]

let failures = 0

for (const check of checks) {
  try {
    const response = await fetch(check.url, { method: 'HEAD' })
    const type = response.headers.get('content-type') ?? ''
    const okStatus = response.ok
    const okType = !check.expectAudio || type.startsWith('audio/')
    if (!okStatus || !okType) {
      failures += 1
      console.error(
        `[FAIL] ${check.name} -> ${check.url} (status=${response.status}, content-type=${type || 'n/a'})`,
      )
      continue
    }
    console.log(`[OK] ${check.name} -> ${check.url} (${type || 'no content-type'})`)
  } catch (error) {
    failures += 1
    console.error(`[FAIL] ${check.name} -> ${check.url} (${error instanceof Error ? error.message : String(error)})`)
  }
}

if (failures > 0) {
  process.exit(1)
}

console.log('Post-deploy media checks passed.')
