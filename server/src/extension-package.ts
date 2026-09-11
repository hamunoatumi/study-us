import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { ZipArchive } from 'archiver'
import type { Response } from 'express'

const LOCAL_APP_ORIGINS = [
  'http://localhost',
  'http://127.0.0.1',
] as const

type ContentScriptDefinition = {
  matches?: string[]
}

type ExtensionManifest = {
  content_scripts?: ContentScriptDefinition[]
  [key: string]: unknown
}

const findExtensionDirectory = (): string => {
  const candidates = [
    resolve(process.cwd(), 'extension'),
    resolve(process.cwd(), '..', 'extension'),
  ]
  const directory = candidates.find((candidate) =>
    existsSync(resolve(candidate, 'manifest.json')),
  )

  if (directory === undefined) {
    throw new Error('拡張機能のテンプレートが見つかりません')
  }

  return directory
}

export const createExtensionMatchPatterns = (
  allowedOrigins: ReadonlySet<string>,
): string[] => {
  const origins = allowedOrigins.size > 0
    ? [...allowedOrigins]
    : [...LOCAL_APP_ORIGINS]

  return origins.map((origin) => `${origin}/*`)
}

const createConfiguredManifest = async (
  extensionDirectory: string,
  matchPatterns: string[],
): Promise<string> => {
  const manifestPath = resolve(extensionDirectory, 'manifest.json')
  const manifest = JSON.parse(
    await readFile(manifestPath, 'utf8'),
  ) as ExtensionManifest
  const contentScript = manifest.content_scripts?.[0]

  if (contentScript === undefined) {
    throw new Error('manifest.jsonにcontent_scriptsがありません')
  }

  contentScript.matches = matchPatterns
  return `${JSON.stringify(manifest, null, 2)}\n`
}

const createExtensionConfig = (matchPatterns: string[]): string =>
  `globalThis.STUDYUS_PAGE_PATTERNS = ${JSON.stringify(matchPatterns, null, 2)}\n`

export const streamExtensionPackage = async (
  response: Response,
  allowedOrigins: ReadonlySet<string>,
): Promise<void> => {
  const extensionDirectory = findExtensionDirectory()
  const matchPatterns = createExtensionMatchPatterns(allowedOrigins)
  const manifest = await createConfiguredManifest(
    extensionDirectory,
    matchPatterns,
  )

  response.status(200)
  response.setHeader('Content-Type', 'application/zip')
  response.setHeader(
    'Content-Disposition',
    'attachment; filename="study-us-extension.zip"',
  )
  response.setHeader('Cache-Control', 'no-store')

  const archive = new ZipArchive({ zlib: { level: 9 } })
  archive.on('error', (error) => response.destroy(error))
  archive.pipe(response)
  archive.glob('**/*', {
    cwd: extensionDirectory,
    dot: true,
    ignore: ['manifest.json', 'config.js'],
  })
  archive.append(manifest, { name: 'manifest.json' })
  archive.append(createExtensionConfig(matchPatterns), { name: 'config.js' })
  await archive.finalize()
}
