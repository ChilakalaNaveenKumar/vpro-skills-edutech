#!/usr/bin/env node
/**
 * Turns the built single-page app into one real HTML file per public route,
 * and writes the sitemap from the routes it actually produced.
 *
 * Why this is needed at all. Every route currently ships the same index.html,
 * whose <head> React fills in after the bundle runs. Google will execute that
 * JavaScript eventually, but the scrapers behind WhatsApp, Facebook, X and
 * LinkedIn will not: they fetch the HTML, read the og: tags, and give up. So
 * every link shared from this site - including every ad - showed one generic
 * title and one generic description no matter which page it pointed at. That
 * is the problem this fixes.
 *
 * How. The built site is served locally, each route is loaded in headless
 * Chromium exactly as a visitor would load it, and the resulting DOM is
 * written to disk. No second copy of the metadata exists: whatever the React
 * components render is what gets baked in, so the two cannot drift.
 *
 * The output is per-directory - /courses/index.html rather than /courses.html -
 * which is why infra/aws/cloudfront-rewrite.js exists to append index.html to
 * extensionless requests.
 *
 * Usage:  node scripts/prerender.mjs            (after `npm run build`)
 *
 * If Chromium is missing, this fails loudly rather than skipping. A build that
 * quietly published un-prerendered HTML would look successful while leaving
 * every share card wrong, which is the failure this script exists to prevent.
 */

import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const DIST = join(here, '..', 'dist')

const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://www.vproskills.com').replace(/\/$/, '')

/**
 * Routes known ahead of time. Course pages are not listed: they are discovered
 * from the rendered /courses page below, so adding a course to the curriculum
 * gets it prerendered without anyone remembering to edit this file.
 *
 * `priority` and `changefreq` are sitemap hints. Google has said it largely
 * ignores both, but Bing still uses them and they cost nothing.
 */
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/courses', priority: '0.9', changefreq: 'weekly' },
  { path: '/batches', priority: '0.9', changefreq: 'daily' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/data-deletion', priority: '0.3', changefreq: 'yearly' },
]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}

/**
 * index.html carries a comment explaining why it declares no title, and that
 * comment names the tags it is explaining. Both checks below count tags, so
 * both have to stop that prose being counted as markup.
 */
function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '')
}

/**
 * Serves dist/, falling back to the app shell so client-side routes resolve.
 *
 * `shell` is the untouched index.html, held in memory and captured before
 * anything is written. Reading it from disk instead was subtly wrong: the home
 * page's own output overwrites dist/index.html, so every route rendered after
 * it was served a shell that already carried the home page's title, canonical
 * and og: tags, and React then appended the route's own on top. The result was
 * two of everything, with the home page's copy first - which is the one
 * crawlers read. Exactly the bug this script exists to fix, reintroduced by the
 * fix itself.
 */
function serveDist(shell) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const pathname = decodeURIComponent(url.pathname)

    if (!extname(pathname)) {
      res.writeHead(200, { 'Content-Type': MIME['.html'] })
      res.end(shell)
      return
    }

    try {
      const body = await readFile(join(DIST, pathname))
      res.writeHead(200, { 'Content-Type': MIME[extname(pathname)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end('not found')
    }
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

async function main() {
  let shell
  try {
    shell = await readFile(join(DIST, 'index.html'), 'utf8')
  } catch {
    console.error('prerender: dist/index.html is missing. Run `npm run build` first.')
    process.exit(1)
  }

  if (/<title|<meta\s+name="description"/i.test(stripComments(shell))) {
    console.error(
      'prerender: dist/index.html already contains a title or description.\n' +
        '  This usually means it is the output of a previous prerender rather than a\n' +
        '  fresh Vite build. Re-run `vite build` so the shell is clean, otherwise\n' +
        '  every page would inherit that copy on top of its own.',
    )
    process.exit(1)
  }

  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.error(
      'prerender: playwright is not installed.\n' +
        '  npm ci && npx playwright install chromium\n' +
        'Refusing to continue: publishing without prerendering would leave every\n' +
        'shared link and every ad showing the home page title and description.',
    )
    process.exit(1)
  }

  const { server, port } = await serveDist(shell)
  const origin = `http://127.0.0.1:${port}`

  let browser
  try {
    browser = await chromium.launch()
  } catch (error) {
    server.close()
    console.error(
      `prerender: could not start Chromium (${error.message}).\n` +
        '  npx playwright install chromium\n' +
        'On a build agent without the system libraries Chromium needs, run this\n' +
        'step inside mcr.microsoft.com/playwright instead - see docs/RUNBOOK.md.',
    )
    process.exit(1)
  }

  const page = await browser.newPage()
  // The app calls the API for live content and falls back to the bundled copy
  // when it cannot reach it. At build time there is usually no API, and waiting
  // out those requests would add seconds per route for a fallback we are happy
  // with, so they are refused immediately. It also keeps the output
  // deterministic: the prerendered HTML shows the bundled content, and the live
  // content replaces it on the client a moment after load.
  await page.route('**/api/**', (route) => route.abort())

  async function render(path) {
    await page.goto(`${origin}${path}`, { waitUntil: 'networkidle', timeout: 30_000 })
    // Attached, not visible. What matters is that React has committed real
    // content rather than an empty shell; whether it is on screen is a
    // different question, and on a course page the answer is legitimately no -
    // opening a course hides the whole browse layer, heading and all, so
    // waiting for visibility here would time out on every course.
    await page.waitForSelector('h1', { state: 'attached', timeout: 15_000 })
    return page.content()
  }

  // Rendered first, written afterwards. Nothing this script produces can end
  // up being served as the shell for a route rendered later.
  const rendered = []

  try {
    for (const route of STATIC_ROUTES) {
      rendered.push({ ...route, html: await render(route.path) })
      console.log(`prerender: ${route.path}`)
    }

    // Course slugs come from what /courses actually links to, so the set that
    // gets prerendered is by definition the set a visitor can reach.
    await page.goto(`${origin}/courses`, { waitUntil: 'networkidle' })
    const slugs = await page.$$eval('a[href^="/courses/"]', (links) =>
      Array.from(new Set(links.map((a) => a.getAttribute('href')))),
    )

    for (const path of slugs) {
      rendered.push({
        path,
        priority: '0.8',
        changefreq: 'weekly',
        html: await render(path),
      })
      console.log(`prerender: ${path}`)
    }

    if (slugs.length === 0) {
      console.warn(
        'prerender: no course links found on /courses. The course pages will not\n' +
          '  be prerendered or listed in the sitemap. Check that the shelf renders\n' +
          '  its bundled fallback when the API is unreachable.',
      )
    }
  } finally {
    await browser.close()
    server.close()
  }

  for (const route of rendered) {
    const outDir = route.path === '/' ? DIST : join(DIST, route.path)
    await mkdir(outDir, { recursive: true })
    await writeFile(join(outDir, 'index.html'), route.html, 'utf8')
  }

  const duplicated = rendered.filter(
    (route) => (stripComments(route.html).match(/<title/gi) ?? []).length !== 1,
  )
  if (duplicated.length > 0) {
    console.error(
      `prerender: ${duplicated.length} page(s) do not have exactly one <title>: ` +
        `${duplicated.map((route) => route.path).join(', ')}.\n` +
        '  A page with two titles is read by its first one, which is not the one\n' +
        '  the page meant. Failing rather than publishing that.',
    )
    process.exit(1)
  }

  const written = rendered

  const today = new Date().toISOString().slice(0, 10)
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...written.map((route) =>
      [
        '  <url>',
        `    <loc>${SITE_URL}${route.path === '/' ? '/' : route.path}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${route.changefreq}</changefreq>`,
        `    <priority>${route.priority}</priority>`,
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n')

  await writeFile(join(DIST, 'sitemap.xml'), sitemap, 'utf8')
  console.log(`prerender: sitemap.xml with ${written.length} URLs, origin ${SITE_URL}`)
}

main().catch((error) => {
  console.error('prerender failed:', error)
  process.exit(1)
})
