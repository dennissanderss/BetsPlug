import type { StructureBuilder } from "sanity/structure";
import {
  DocumentTextIcon,
  EarthGlobeIcon,
  DashboardIcon,
  CogIcon,
} from "@sanity/icons";

/** Helper: show a singleton document (one fixed document, no list). */
function singleton(S: StructureBuilder, type: string, title: string, id?: string) {
  const docId = id ?? type;
  return S.listItem()
    .title(title)
    .id(type)
    .child(S.document().schemaType(type).documentId(docId).title(title));
}

export const structure = (S: StructureBuilder) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Editorial")
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title("Editorial")
            .items([
              S.documentTypeListItem("learnPillar").title("Learn Pillars"),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title("SEO Hubs")
        .icon(EarthGlobeIcon)
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
        .title("Pages")
        .icon(DashboardIcon)
        .child(
          S.list()
            .title("Pages")
            .items([
              singleton(S, "homepage", "Homepage"),
              singleton(S, "aboutPage", "About"),
              singleton(S, "howItWorksPage", "How It Works"),
              singleton(S, "contactPage", "Contact"),
              singleton(S, "b2bPage", "B2B"),
              singleton(S, "trackRecordPage", "Track Record"),
              singleton(S, "welcomePage", "Welcome"),
              singleton(S, "checkoutPage", "Checkout"),
              singleton(S, "thankYouPage", "Thank You"),
              singleton(S, "pricingConfig", "Pricing"),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title("Site")
        .icon(CogIcon)
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
