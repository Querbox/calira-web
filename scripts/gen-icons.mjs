import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svg = readFileSync(join(root, 'public', 'calira-icon.svg'), 'utf-8')

const sizes = [
  { name: 'icon-192.png',          size: 192 },
  { name: 'icon-512.png',          size: 512 },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png',  size: 180 },
]

for (const { name, size, maskable } of sizes) {
  // For maskable icons we need extra padding (safe zone ~10% on each side)
  const inputSvg = maskable
    ? svg.replace(
        '<rect width="512" height="512"',
        '<rect width="640" height="640" x="-64" y="-64"',
      )
    : svg
  const resvg = new Resvg(inputSvg, {
    fitTo: { mode: 'width', value: size },
    background: 'transparent',
  })
  const png = resvg.render().asPng()
  writeFileSync(join(root, 'public', name), png)
  console.log(`✓ ${name} (${size}px${maskable ? ', maskable' : ''})`)
}
