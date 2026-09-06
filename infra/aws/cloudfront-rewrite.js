// CloudFront Function (viewer request) - maps clean URLs onto the prerendered
// files in S3.
//
// web/scripts/prerender.mjs writes one directory per route: /courses becomes
// courses/index.html, /courses/agentic-ai becomes courses/agentic-ai/index.html.
// S3 has no notion of a directory index, so a request for /courses finds no
// such key and 404s. The distribution turns that 404 into /index.html with a
// 200, which is what made client-side routing work before prerendering existed -
// but it also means the visitor and, more importantly, every crawler and share
// scraper would get the bare app shell instead of the page that was rendered
// for that URL. All the per-page titles and og: tags would be invisible to
// exactly the clients they were built for.
//
// So: rewrite extensionless paths to their index.html before the request
// reaches the origin. Genuinely unknown routes still miss, still 404, and still
// fall through to the SPA shell, which renders the in-app 404 page.
//
// Only attached to the default cache behaviour, so /api/* is never touched.
//
// This is a CloudFront Function, not Lambda@Edge: it runs in a restricted
// ES5-era JavaScript environment with no async, no network and a sub-millisecond
// budget. Keep it this simple.

function handler(event) {
  var request = event.request
  var uri = request.uri

  // "/" is served by default_root_object.
  if (uri === '/') {
    return request
  }

  // "/courses/" and "/courses" should both reach the same file.
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html'
    return request
  }

  // A dot in the last segment means "asset", anywhere else means nothing:
  // /assets/index-abc.js is a file, /courses/react.js/intro would still be a
  // route. Testing the whole path instead would leave the second unrewritten.
  //
  // The remaining limitation is a slug that itself contains a dot - a course at
  // /courses/node.js would be read as a file, miss in S3, and fall through to
  // the app shell. It would still render, just without its prerendered head, so
  // avoid dots in slugs. None of the six have one.
  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1)
  if (lastSegment.indexOf('.') === -1) {
    request.uri = uri + '/index.html'
  }

  return request
}
