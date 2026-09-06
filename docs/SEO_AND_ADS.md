# SEO, tracking and running ads

What the site does on its own, and the five things a person still has to do.

## What is already working

**Every page has its own title, description and share card.** Before this, all
of them shipped the same generic set, because the app is a single page and the
tags were written into `index.html` once. Now `web/src/seo/Seo.tsx` renders them
per route and React 19 hoists them into `<head>`.

**Those tags are in the static HTML, not added by JavaScript.** This is the part
that matters for ads. WhatsApp, Facebook, X and LinkedIn do not run JavaScript
when they fetch a link to build a preview; they read the HTML and stop. So
`npm run build` finishes by loading every public route in headless Chromium and
writing the result to disk - `/courses` becomes `courses/index.html` and so on.
A CloudFront Function (`infra/aws/cloudfront-rewrite.js`) maps clean URLs onto
those files.

**Search engines are told what the pages are.** `robots.txt`, a `sitemap.xml`
generated from the routes actually built (including the pictures each page
renders, so Google Images can find the logo and the trainer), and JSON-LD
describing the organisation, the site, the trainer, the office, each course,
the FAQ and the breadcrumbs.

**The icon Google puts next to a result is a real file.** `/favicon.ico` is
declared first because Google fetches that path whether you mention it or not.
The unused studio photographs and the 200KB logo that used to ship with every
page are gone; the remaining pictures have width, height and an alt.

**Conversions are reported where they happen.** Every route to contacting this
business ends at a WhatsApp link rendered by `CtaLink`, plus the enquiry form.
Both now report a lead to GA4, Google Ads and Meta. Nothing earlier - a page
view, a scroll - is counted, because optimising ad spend towards people who
looked rather than people who got in touch is how budgets get wasted.

**Nothing loads until the visitor agrees.** With no tracking IDs configured, no
tag loads and the consent notice does not appear at all. With IDs configured,
the notice asks, and declining leaves the scripts unfetched rather than loaded
in a restricted mode.

## The five things still to do

### 1. Fill in the legal pages

`/privacy`, `/terms` and `/data-deletion` are written and live, with six company
facts left as visible placeholders. See **docs/LEGAL_HANDOVER.md**. Meta will not
approve an ad account without a reachable privacy policy and data-deletion URL,
so this blocks the Meta campaign specifically.

From `web/`, `npm run check:legal` lists what is outstanding.

### 2. Create the accounts and set four variables

| Variable | Where it comes from |
| --- | --- |
| `GA4_MEASUREMENT_ID` | Google Analytics > Admin > Data streams > Measurement ID (`G-…`) |
| `GOOGLE_ADS_ID` | Google Ads > Tools > Conversions > the tag ID (`AW-…`) |
| `GOOGLE_ADS_CONVERSION_LABEL` | The half after the slash in `AW-000000000/AbC-D_efGh` |
| `META_PIXEL_ID` | Meta Events Manager > Data sources > Pixel ID |
| `GOOGLE_SITE_VERIFICATION` | Search Console > Settings > Ownership verification > HTML tag, the `content=` value only. Optional if you verify by DNS instead. |

Set them in **Manage Jenkins > System > Global properties**, alongside
`CLOUDFRONT_DOMAIN`. They are not secrets - every one is inlined into the
published JavaScript by design - so they are plain environment variables rather
than credentials.

The build reads them without them being set, so a deploy before the accounts
exist is safe: it simply ships with no tracking and no consent notice.

Also set `SITE_URL` to the real public origin once a domain is in front of
CloudFront. It defaults to `https://www.vproskills.com`; if that is wrong, every
canonical URL and the whole sitemap point at the wrong place.

The Google Ads conversion action must be created as a **Website** conversion, and
its tag setup left as "install the tag yourself" - the site fires it through
`gtag('event', 'conversion')` already.

### 3. Exclude Quebec from ad targeting

The privacy policy is written on the basis that Quebec's Law 25 does not apply.
It reaches any business that monitors the behaviour of Quebec residents, which
is exactly what an advertising pixel does, and it would require a publicly named
privacy officer and a written privacy impact assessment before sending personal
data outside the province.

**Exclude Quebec in both Google Ads and Meta.** The rest of Canada is fine. The
EU and the UK are excluded for a related reason: both need a formally appointed
representative established in the region before you may advertise there.

Full reasoning in docs/LEGAL_HANDOVER.md.

### 4. Submit the site

Once the first deploy with a real domain is out:

- **Google Search Console** - add the URL-prefix property for the live
  origin, verify by DNS (or paste the HTML-tag token into
  `GOOGLE_SITE_VERIFICATION` and redeploy), then submit
  `https://<domain>/sitemap.xml`. Until this is done, Google has no reason to
  look at the site, no matter how complete the tags are.
- **Bing Webmaster Tools** - can import the Search Console setup wholesale.
- **Google Business Profile** - the office address and phone in the profile
  must match `web/src/content/contact.ts` exactly. Do not list a classroom or
  walk-in hours: every class is online. Search engines compare the name,
  address and phone they find and discount all of them if they disagree.

### 5. Check it worked

| Check | Where | What you want |
| --- | --- | --- |
| Share card | [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) | The page's own title and the copper card, not the home page's |
| Share card | [X Card Validator](https://cards-dev.twitter.com/validator) | Same |
| Structured data | [Rich Results Test](https://search.google.com/test/rich-results) | Course, FAQ, LocalBusiness, Breadcrumb all valid |
| Indexing | Search Console > URL Inspection | Rendered page shows the real content |
| Pixel | Meta Pixel Helper extension | `PageView` on load, `Lead` on a WhatsApp click |
| Ads tag | Google Tag Assistant | `page_view`, then `conversion` on a WhatsApp click |

For the two pixel checks you have to accept the consent notice first. That is
the point of it.

## Things worth knowing

**Reported conversions will undercount.** Only visitors who accept the notice
are measured. That is the deliberate trade for asking honestly, and it means
the real conversion rate is higher than the dashboard says. Judge campaigns on
relative movement rather than absolute counts.

**A new course needs no SEO work.** The prerenderer discovers course pages from
the links on `/courses`, so adding one to the curriculum gets it prerendered,
sitemapped and given structured data automatically.

**Avoid dots in course slugs.** `/courses/node.js` would be read as a file
request by the CloudFront rewrite, miss in S3, and fall through to the app
shell. The page would still render, just without its prerendered head.

**If a build fails at the prerender step**, it is Chromium. The pipeline runs
`npx playwright install chromium` before building; on an agent missing the
system libraries Chromium needs, run that step inside
`mcr.microsoft.com/playwright` instead. The script fails rather than skipping on
purpose - a build that quietly published un-prerendered HTML would look
successful while leaving every share card wrong.

**To regenerate the share card**, edit `web/public/_og-source.html`, serve
`web/public`, and screenshot it at exactly 1200x630 into
`web/public/og-default.png`.
