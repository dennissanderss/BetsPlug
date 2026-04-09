<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"
    doctype-system="about:legacy-compat" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>XML Sitemap — BetsPlug</title>
        <style type="text/css">
          :root {
            color-scheme: dark;
          }
          * {
            box-sizing: border-box;
          }
          html,
          body {
            margin: 0;
            padding: 0;
            background: #070a12;
            color: #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
          }
          a {
            color: #4ade80;
            text-decoration: none;
            transition: color 0.15s ease;
          }
          a:hover {
            color: #86efac;
            text-decoration: underline;
          }
          .header {
            background: linear-gradient(
              135deg,
              rgba(74, 222, 128, 0.08) 0%,
              rgba(16, 185, 129, 0.04) 100%
            );
            border-bottom: 1px solid rgba(74, 222, 128, 0.15);
            padding: 28px 0;
          }
          .container {
            max-width: 1180px;
            margin: 0 auto;
            padding: 0 28px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #4ade80;
          }
          .brand .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4ade80;
            box-shadow: 0 0 12px rgba(74, 222, 128, 0.7);
          }
          h1 {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin: 14px 0 6px;
            color: #ffffff;
          }
          .subtitle {
            font-size: 15px;
            color: #94a3b8;
            margin: 0 0 4px;
            max-width: 760px;
          }
          .subtitle strong {
            color: #e2e8f0;
          }
          .stats {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 14px;
            padding: 6px 14px;
            background: rgba(74, 222, 128, 0.08);
            border: 1px solid rgba(74, 222, 128, 0.25);
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #4ade80;
          }
          main {
            padding: 32px 0 64px;
          }
          .card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 18px;
            overflow: hidden;
            backdrop-filter: blur(12px);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          thead th {
            background: rgba(255, 255, 255, 0.03);
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 11px;
            text-align: left;
            padding: 14px 18px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            white-space: nowrap;
          }
          tbody td {
            padding: 12px 18px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            vertical-align: middle;
            color: #cbd5e1;
          }
          tbody tr:last-child td {
            border-bottom: none;
          }
          tbody tr:hover td {
            background: rgba(74, 222, 128, 0.04);
            color: #ffffff;
          }
          tbody tr:hover a {
            color: #86efac;
          }
          td.idx {
            color: #64748b;
            font-variant-numeric: tabular-nums;
            width: 56px;
          }
          td.url {
            word-break: break-all;
          }
          td.num {
            font-variant-numeric: tabular-nums;
            color: #94a3b8;
            text-align: center;
            width: 110px;
          }
          td.freq {
            text-transform: capitalize;
            color: #94a3b8;
            width: 130px;
          }
          td.date {
            color: #94a3b8;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
            width: 130px;
          }
          .pri-pill {
            display: inline-block;
            min-width: 36px;
            padding: 3px 10px;
            border-radius: 999px;
            background: rgba(74, 222, 128, 0.1);
            border: 1px solid rgba(74, 222, 128, 0.25);
            color: #4ade80;
            font-weight: 700;
            text-align: center;
            font-size: 11px;
          }
          .footer {
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
            color: #64748b;
            font-size: 12px;
            text-align: center;
          }
          @media (max-width: 720px) {
            h1 {
              font-size: 24px;
            }
            .container {
              padding: 0 18px;
            }
            thead th,
            tbody td {
              padding: 10px 12px;
            }
            td.num,
            td.freq,
            td.date,
            th.num,
            th.freq,
            th.date {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="container">
            <div class="brand">
              <span class="dot"></span>
              BetsPlug · XML Sitemap
            </div>
            <h1>XML Sitemap</h1>
            <p class="subtitle">
              This is an XML sitemap, meant to be consumed by search engines like
              <strong>Google</strong>, <strong>Bing</strong> and
              <strong>DuckDuckGo</strong>. You can find more information about
              XML sitemaps on
              <a href="https://www.sitemaps.org/" target="_blank" rel="noopener">sitemaps.org</a>.
            </p>
            <span class="stats">
              <xsl:value-of select="count(s:urlset/s:url)" />
              URLs indexed
            </span>
          </div>
        </div>

        <main>
          <div class="container">
            <div class="card">
              <table>
                <thead>
                  <tr>
                    <th class="idx">#</th>
                    <th>URL</th>
                    <th class="num">Languages</th>
                    <th class="num">Priority</th>
                    <th class="freq">Change Freq.</th>
                    <th class="date">Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="s:urlset/s:url">
                    <tr>
                      <td class="idx">
                        <xsl:value-of select="position()" />
                      </td>
                      <td class="url">
                        <a href="{s:loc}" target="_blank" rel="noopener">
                          <xsl:value-of select="s:loc" />
                        </a>
                      </td>
                      <td class="num">
                        <xsl:value-of select="count(xhtml:link)" />
                      </td>
                      <td class="num">
                        <span class="pri-pill">
                          <xsl:value-of select="s:priority" />
                        </span>
                      </td>
                      <td class="freq">
                        <xsl:value-of select="s:changefreq" />
                      </td>
                      <td class="date">
                        <xsl:value-of select="substring(s:lastmod, 1, 10)" />
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </div>

            <div class="footer">
              Generated dynamically by BetsPlug · Cached for 1 hour ·
              <a href="/robots.txt">robots.txt</a>
            </div>
          </div>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
