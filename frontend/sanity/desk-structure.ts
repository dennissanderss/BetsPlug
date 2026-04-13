import type { StructureBuilder } from "sanity/structure";

export const structure = (S: StructureBuilder) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Editorial")
        .child(
          S.list()
            .title("Editorial")
            .items([
              S.documentTypeListItem("article").title("Articles"),
              S.documentTypeListItem("learnPillar").title("Learn Pillars"),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title("SEO Hubs")
        .child(
          S.list()
            .title("SEO Hubs")
            .items([
              S.documentTypeListItem("leagueHub").title("League Hubs"),
              S.documentTypeListItem("betTypeHub").title("Bet Type Hubs"),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title("Site")
        .child(
          S.list()
            .title("Site")
            .items([
              S.documentTypeListItem("legalPage").title("Legal Pages"),
              S.documentTypeListItem("testimonial").title("Testimonials"),
              S.documentTypeListItem("pageMeta").title("Page SEO"),
            ]),
        ),
    ]);
