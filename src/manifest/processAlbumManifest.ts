import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'

import type { AlbumManifest, AlbumManifestSource } from '../types/album'

/**
 * Supported Markdown (via marked): ATX headings (#–######), setext headings,
 * lists (ordered / task), emphasis (**bold**, *italic*), strikethrough, links,
 * images, blockquotes, horizontal rules, fenced code blocks, tables.
 * Output is sanitized with DOMPurify (HTML profile) before DOM use.
 */
export function compileMarkdownToSafeHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false })
  if (typeof rawHtml !== 'string') {
    throw new Error('Markdown compilation did not return a string (unexpected async output)')
  }
  return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } })
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Album manifest invalid: ${label} must be a non-empty string`)
  }
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Album manifest invalid: ${label} must be a string`)
  }
}

/** Parse and validate raw manifest JSON, then compile Markdown fields to sanitized HTML. */
export function processAlbumManifestJson(jsonText: string): AlbumManifest {
  let raw: unknown
  try {
    raw = JSON.parse(jsonText) as unknown
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`Album manifest JSON is invalid: ${msg}`)
  }

  if (raw === null || typeof raw !== 'object') {
    throw new Error('Album manifest invalid: root must be an object')
  }

  const root = raw as Record<string, unknown>
  const albumRaw = root.album
  const tracksRaw = root.tracks

  if (albumRaw === null || typeof albumRaw !== 'object' || Array.isArray(albumRaw)) {
    throw new Error('Album manifest invalid: missing or invalid "album" object')
  }
  if (!Array.isArray(tracksRaw)) {
    throw new Error('Album manifest invalid: "tracks" must be an array')
  }

  const albumObj = albumRaw as Record<string, unknown>
  assertNonEmptyString(albumObj.title, 'album.title')
  assertString(albumObj.heroImageUrl, 'album.heroImageUrl')
  assertString(albumObj.story, 'album.story')
  if (albumObj.subtitle !== undefined) assertString(albumObj.subtitle, 'album.subtitle')
  if (albumObj.era !== undefined) assertString(albumObj.era, 'album.era')

  const source: AlbumManifestSource = {
    album: {
      title: albumObj.title as string,
      subtitle: albumObj.subtitle as string | undefined,
      era: albumObj.era as string | undefined,
      heroImageUrl: albumObj.heroImageUrl as string,
      story: albumObj.story as string,
    },
    tracks: [],
  }

  for (let i = 0; i < tracksRaw.length; i++) {
    const item = tracksRaw[i]
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Album manifest invalid: tracks[${i}] must be an object`)
    }
    const t = item as Record<string, unknown>
    assertNonEmptyString(t.title, `tracks[${i}].title`)
    assertNonEmptyString(t.slug, `tracks[${i}].slug`)
    assertNonEmptyString(t.audioUrl, `tracks[${i}].audioUrl`)
    assertString(t.story, `tracks[${i}].story`)
    if (t.downloadUrl !== undefined) assertString(t.downloadUrl, `tracks[${i}].downloadUrl`)
    if (t.coverUrl !== undefined) assertString(t.coverUrl, `tracks[${i}].coverUrl`)
    if (t.duration !== undefined) {
      if (typeof t.duration !== 'number' || !Number.isFinite(t.duration)) {
        throw new Error(`Album manifest invalid: tracks[${i}].duration must be a finite number`)
      }
    }

    source.tracks.push({
      title: t.title as string,
      slug: t.slug as string,
      audioUrl: t.audioUrl as string,
      downloadUrl: t.downloadUrl as string | undefined,
      duration: t.duration as number | undefined,
      coverUrl: t.coverUrl as string | undefined,
      story: t.story as string,
    })
  }

  return {
    album: {
      title: source.album.title,
      subtitle: source.album.subtitle,
      era: source.album.era,
      heroImageUrl: source.album.heroImageUrl,
      storyHtml: compileMarkdownToSafeHtml(source.album.story),
    },
    tracks: source.tracks.map((tr) => ({
      title: tr.title,
      slug: tr.slug,
      audioUrl: tr.audioUrl,
      downloadUrl: tr.downloadUrl,
      duration: tr.duration,
      coverUrl: tr.coverUrl,
      storyHtml: compileMarkdownToSafeHtml(tr.story),
    })),
  }
}
