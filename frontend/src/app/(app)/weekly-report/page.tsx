import { redirect } from "next/navigation";

// Deprecated route — kept as a server-side redirect so old bookmarks
// and localized URLs (e.g. /nl/weekrapport) keep working until they
// fall out of search engine caches. Schedule for removal once
// /results has fully replaced it in marketing copy.
export default function WeeklyReportPage() {
  redirect("/results");
}
