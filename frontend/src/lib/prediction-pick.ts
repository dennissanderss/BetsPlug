/**
 * Derive a normalized pick side ("home" | "draw" | "away") from a fixture's
 * prediction. Prefers the backend-computed `pick` field (returned by
 * `/fixtures/results`, `/fixtures/today`, `/fixtures/upcoming` and
 * `/bet-of-the-day`), falls back to argmax over the three outcome probs
 * for responses where `pick` is absent or null.
 *
 * Using this helper instead of re-argmaxing keeps the frontend's pick
 * classification consistent with the backend — including tiebreaks.
 */

export type PickSide = "home" | "draw" | "away";

type PickLike = {
  pick?: string | null;
  home_win_prob?: number | null;
  draw_prob?: number | null;
  away_win_prob?: number | null;
};

export function derivePickSide(prediction: PickLike | null | undefined): PickSide | null {
  if (!prediction) return null;

  const raw = prediction.pick;
  if (raw) {
    const lower = raw.toLowerCase();
    if (lower === "home" || lower === "draw" || lower === "away") return lower;
  }

  const h = prediction.home_win_prob;
  const d = prediction.draw_prob ?? 0;
  const a = prediction.away_win_prob;
  if (h == null || a == null) return null;

  if (h >= a && h >= d) return "home";
  if (d >= a) return "draw";
  return "away";
}

/** Short 1 / X / 2 label used in compact rows. */
export function pickLabel(prediction: PickLike | null | undefined): "1" | "X" | "2" | "—" {
  const side = derivePickSide(prediction);
  if (side === "home") return "1";
  if (side === "draw") return "X";
  if (side === "away") return "2";
  return "—";
}
