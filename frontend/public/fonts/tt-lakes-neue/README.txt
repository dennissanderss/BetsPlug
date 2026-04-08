TT Lakes Neue — Font files
===========================

TT Lakes Neue is a commercial typeface from TypeType (https://typetype.org/).
A valid license is required before using it in production.

Drop the following .woff2 files in this directory:

    TTLakesNeue-Regular.woff2    (weight 400 — body text)
    TTLakesNeue-Medium.woff2     (weight 500 — optional, used by font-medium)
    TTLakesNeue-DemiBold.woff2   (weight 600 — optional, used by font-semibold)
    TTLakesNeue-Bold.woff2       (weight 700 — headings)
    TTLakesNeue-ExtraBold.woff2  (weight 800 — optional, used by font-extrabold)

The @font-face declarations live in src/app/globals.css and automatically
pick up the files from this directory. Until the files are present, the
fallback chain (system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue,
Arial, sans-serif) keeps the site rendering correctly.
