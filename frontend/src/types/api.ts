// ============================================
// BetsPlug - API Types
// ============================================

// ─── Authentication ──────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: User;
}

// ─── Subscription (for my own account) ───────────────────────

export interface MySubscription {
  has_subscription: boolean;
  plan: string | null;
  status: string | null;
  is_lifetime: boolean;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
}

export interface MyPayment {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  description: string | null;
}

// ─── Admin Finance ───────────────────────────────────────────

export interface AdminExpense {
  id: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  expense_date: string;
  notes: string | null;
  created_at: string;
}

export interface FinancePoint {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  payments_count: number;
  subscribers: number;
  new_subscribers: number;
}

export interface FinanceOverview {
  range_start: string;
  range_end: string;
  granularity: "day" | "week" | "month" | "year";
  total_revenue: number;
  total_expenses: number;
  total_profit: number;
  currency: string;
  total_subscribers: number;
  subscribers_in_range: number;
  new_subscribers_in_range: number;
  timeline: FinancePoint[];
  by_plan: Record<string, number>;
  expenses_by_category: Record<string, number>;
}

export interface AdminTodayOverview {
  date: string; // ISO yyyy-mm-dd
  new_users: number;
  new_subscribers: number;
  revenue: number;
  payments: number;
  predictions_published: number;
  currency: string;
}

export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
}

export interface League {
  id: string;
  sport_id: string;
  name: string;
  slug: string;
  country: string | null;
  tier: number | null;
  is_active: boolean;
}

export interface Team {
  id: string;
  league_id: string;
  name: string;
  slug: string;
  short_name: string | null;
  logo_url: string | null;
  country: string | null;
  venue: string | null;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  slug: string;
  position: string | null;
  nationality: string | null;
  jersey_number: number | null;
}

export interface LiveMatch {
  external_id: string;
  league_slug: string;
  home_team_slug: string;
  away_team_slug: string;
  scheduled_at: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  venue: string | null;
  matchday: number | null;
  home_score: number | null;
  away_score: number | null;
  season_name: string | null;
}

export interface MatchResult {
  home_score: number;
  away_score: number;
  home_score_ht: number | null;
  away_score_ht: number | null;
  winner: "home" | "away" | "draw" | null;
}

export interface Match {
  id: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_team_logo?: string | null;
  away_team_logo?: string | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  scheduled_at: string;
  venue: string | null;
  round_name: string | null;
  matchday: number | null;
  result: MatchResult | null;
}

export interface ForecastOutput {
  match_id: string;
  home_win_prob: number;
  draw_prob: number | null;
  away_win_prob: number;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
  confidence: number;
  confidence_interval_low: number | null;
  confidence_interval_high: number | null;
  model_name: string;
  model_version: string;
  predicted_at: string;
  is_simulation: boolean;
  disclaimer: string;
  explanation: PredictionExplanation | null;
}

export interface PredictionExplanation {
  summary: string;
  top_factors_for: Record<string, number>;
  top_factors_against: Record<string, number>;
  similar_historical: Record<string, unknown> | null;
}

/** Lightweight match summary embedded in PredictionResponse (v6.1 /predictions).
 * Only the fields the feed/table UIs actually need — not a full Match. */
export interface PredictionMatchSummary {
  id: string;
  home_team_name: string;
  away_team_name: string;
  home_team_logo?: string | null;
  away_team_logo?: string | null;
  scheduled_at: string;
  status: string;
  league_name: string | null;
  result: {
    home_score: number | null;
    away_score: number | null;
    winner: "home" | "away" | "draw" | null;
  } | null;
}

/** Lightweight model summary embedded in PredictionResponse (v6.2).
 * Surfaces which model produced each prediction for transparency. */
export interface PredictionModelSummary {
  id: string;
  name: string;
  version: string;
  model_type: string;
}

/** Public view of a ModelVersion row returned by GET /api/models (v6.2). */
export interface ModelOverview {
  id: string;
  name: string;
  version: string;
  model_type: string;
  sport_scope: string;
  description: string | null;
  trained_at: string;
  is_active: boolean;
  accuracy: number | null;
  brier_score: number | null;
  sample_size: number | null;
  hyperparameter_keys: string[];
}

/**
 * v8.1 pick-tier slug — lowercase, stable API key.
 * The UI looks up emoji and copy via TIER_DISPLAY (see pick-tier-badge.tsx).
 */
export type PickTierSlug = "free" | "silver" | "gold" | "platinum";

/** v8.1 — three fields added to every pick response when TIER_SYSTEM_ENABLED. */
export interface PickTierFields {
  /** Stable slug — use for logic / cache keys. */
  pick_tier?: PickTierSlug | null;
  /** UI-ready label with emoji, e.g. "🟢 Platinum". */
  pick_tier_label?: string | null;
  /** Display accuracy claim, e.g. "80%+". */
  pick_tier_accuracy?: string | null;
}

/**
 * v8.2 — one entry in the "Why this pick?" top-drivers block.
 * Derived server-side from the prediction's features_snapshot.
 */
export interface PredictionDriver {
  /** Internal feature key, e.g. "elo_diff", "h2h_home_wr". */
  feature: string;
  /** Human-readable label ready to render. */
  label: string;
  /** Pre-formatted value string ("+120", "70%", "+0.42 ppg"). */
  value: string;
  /** Abs z-score vs typical prior. Used only for ordering. */
  impact: number;
  /** Who benefits: 'home', 'away', or 'neutral'. */
  direction?: "home" | "away" | "neutral" | null;
}

export interface Prediction extends PickTierFields {
  id: string;
  match_id: string;
  model_version_id: string;
  predicted_at: string;
  home_win_prob: number;
  draw_prob: number | null;
  away_win_prob: number;
  confidence: number;
  is_simulation: boolean;
  pick?: string | null;
  reasoning?: string | null;
  explanation: PredictionExplanation | null;
  evaluation: PredictionEvaluation | null;
  match: PredictionMatchSummary | null;
  model_info: PredictionModelSummary | null;
  /** Optional — populated when features_snapshot is available. */
  top_drivers?: PredictionDriver[] | null;
}

/** v6.2: BOTD response now includes optional pre-match odds. */
export interface BetOfTheDayOdds {
  home: number | null;
  draw: number | null;
  away: number | null;
  over_2_5: number | null;
  under_2_5: number | null;
  bookmaker: string | null;
  fetched_at: string | null;
}

export interface BetOfTheDayResponse extends PickTierFields {
  available: boolean;
  match_id: string | null;
  home_team: string | null;
  away_team: string | null;
  league: string | null;
  scheduled_at: string | null;
  home_win_prob: number | null;
  draw_prob: number | null;
  away_win_prob: number | null;
  confidence: number | null;
  predicted_outcome: string | null;
  explanation_summary: string | null;
  prediction_id: string | null;
  odds: BetOfTheDayOdds | null;
  /** v8.2 — top-3 drivers surfaced on the Pick of the Day page. */
  top_drivers?: PredictionDriver[] | null;
}

export interface PredictionEvaluation {
  actual_outcome: string;
  is_correct: boolean;
  brier_score: number;
  log_loss: number | null;
  evaluated_at: string;
}

/** v8.1 — per-tier slice for aggregate endpoints (trackrecord, dashboard). */
export interface TierBreakdown {
  total: number;
  correct: number;
  accuracy: number;
  wilson_ci_low?: number | null;
  wilson_ci_high?: number | null;
}

export interface TrackrecordSummary {
  total_predictions: number;
  accuracy: number;
  wilson_ci_low?: number | null;
  wilson_ci_high?: number | null;
  brier_score: number;
  log_loss: number;
  avg_confidence: number;
  calibration_error: number;
  period_start: string | null;
  period_end: string | null;
  /** v8.1: breakdown by pick_tier; omitted or null when flag is off. */
  per_tier?: Partial<Record<PickTierSlug, TierBreakdown>> | null;
}

export interface SegmentPerformance {
  segment_key: string;
  segment_value: string;
  total: number;
  accuracy: number;
  brier_score: number;
  avg_confidence: number;
}

export interface CalibrationBucket {
  bucket_index: number;
  lower_bound: number;
  upper_bound: number;
  predicted_avg: number;
  observed_freq: number;
  count: number;
  calibration_gap: number;
}

export interface CalibrationReport {
  model_version_id: string | null;
  model_version_label: string | null;
  num_buckets: number;
  buckets: CalibrationBucket[];
  overall_ece: number;
  generated_at: string;
}

export interface BacktestRun {
  id: string;
  name: string;
  sport_slug: string;
  league_slug: string | null;
  start_date: string;
  end_date: string;
  total_predictions: number;
  accuracy: number | null;
  brier_score: number | null;
  log_loss: number | null;
  status: string;
  ran_at: string;
}

export interface ReportJob {
  id: string;
  report_type: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface GeneratedReport {
  id: string;
  job_id: string;
  title: string;
  file_format: string;
  file_size_bytes: number | null;
  summary: string | null;
  created_at: string;
}

export interface DataSourceHealth {
  id: string;
  name: string;
  adapter_type: string;
  is_active: boolean;
  reliability_score: number | null;
  last_sync_at: string | null;
  status: "healthy" | "degraded" | "unknown";
}

export interface IngestionRun {
  id: string;
  data_source_id: string;
  job_type: string;
  status: string;
  records_fetched: number;
  records_inserted: number;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
}

export interface SearchResult {
  id: string;
  entity_type: "sport" | "league" | "team" | "match";
  name: string;
  description: string | null;
  slug: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SearchResultGroup {
  entity_type: string;
  label: string;
  items: SearchResult[];
  total_hits: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface TeamForm {
  last_5: string[];
  last_10: string[];
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
}

export interface TeamDetail extends Team {
  league: League | null;
  recent_form: TeamForm | null;
  stats: TeamStatsData | null;
}

export interface TeamStatsData {
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
  home_wins: number;
  away_wins: number;
  avg_goals_scored: number | null;
  avg_goals_conceded: number | null;
}

export interface WeeklyPerformer {
  name: string;
  accuracy: number;
  total: number;
}

export interface WeeklySummary {
  total_calls: number;
  won: number;
  lost: number;
  win_rate: number;
  pl_units: number;
  best_performers: WeeklyPerformer[];
  worst_performers: WeeklyPerformer[];
}

// ─── Free Picks (Homepage) ───────────────────────────────────────────────────

export interface FreePickItem {
  id: string;
  match_id: string;
  home_team: string;
  away_team: string;
  home_team_logo?: string | null;
  away_team_logo?: string | null;
  league: string;
  scheduled_at: string;
  pick: string | null;
  home_win_prob: number | null;
  draw_prob: number | null;
  away_win_prob: number | null;
  confidence: number | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  is_correct: boolean | null;
}

export interface FreePicksResponse {
  today: FreePickItem[];
  yesterday: FreePickItem[];
  stats: { total: number; correct: number; winrate: number };
}

// ─── Fixture (DB-only, fast) ──────────────────────────────────────────────────

export interface FixturePrediction {
  home_win_prob: number;
  draw_prob: number | null;
  away_win_prob: number;
  predicted_home_score?: number | null;
  predicted_away_score?: number | null;
  confidence: number;
  model_name: string | null;
  predicted_at?: string;
  pick?: string | null;
  reasoning?: string | null;
  edge?: Record<string, number> | null;
  /** v8.5 — single-number edge for the picked side (vig-removed). Null
   *  when no closing-odds snapshot is on file. Used by /predictions
   *  "Edge-verified" filter. */
  edge_pct?: number | null;
  /** v8.5 — bookmaker odds for the picked side at snapshot time. */
  bookmaker_odds_pick?: number | null;
  /** v8.6 — true when bookmaker_odds_pick < 1.50 (heavy favorite that
   *  doesn't pay enough to be worth a stake). UI hides by default. */
  below_odds_floor?: boolean;
  implied_probabilities?: Record<string, number> | null;
  top_features?: Array<
    | { feature: string; importance: number }
    | { name: string; home: number; draw: number; away: number; weight: number }
  > | null;
  /** v8.2 — top-3 feature drivers for the "Why this pick?" UI block. */
  top_drivers?: PredictionDriver[] | null;
  /** v8.3 — tier metadata shown as a badge on the visible pick. */
  pick_tier?: "free" | "silver" | "gold" | "platinum" | null;
  pick_tier_label?: string | null;
  pick_tier_accuracy?: string | null;
}

/** Shape returned by /api/fixtures/today, /upcoming, /results */
/** v6: pre-match odds embedded in a fixture card. Only populated
 * when odds_history has a row for the match. The frontend should
 * render NOTHING when `odds` is null — no "—" placeholder.
 */
export interface FixtureOdds {
  home?: number | null;
  draw?: number | null;
  away?: number | null;
  over_2_5?: number | null;
  under_2_5?: number | null;
  bookmaker?: string | null;
  fetched_at?: string | null;
}

export interface Fixture {
  id: string;
  league_id?: string;
  league_name: string;
  league_slug: string;
  league_country?: string | null;
  home_team_id?: string;
  home_team_name: string;
  home_team_slug: string;
  home_team_logo?: string | null;
  away_team_id?: string;
  away_team_name: string;
  away_team_slug: string;
  away_team_logo?: string | null;
  external_id?: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  scheduled_at: string;
  venue: string | null;
  round_name?: string | null;
  matchday: number | null;
  result: {
    home_score: number;
    away_score: number;
    winner: "home" | "away" | "draw" | null;
    home_score_ht?: number | null;
    away_score_ht?: number | null;
  } | null;
  prediction: FixturePrediction | null;
  /** v8.4 — set when a v8.1 prediction EXISTS for this match but the
   * caller's subscription tier is below the pick's tier. The UI uses
   * this slug to render an "Upgrade to 🔵 Gold" teaser where the
   * probs would normally be. Null when the pick is visible or no
   * prediction exists. */
  locked_pick_tier?: "silver" | "gold" | "platinum" | null;
  locked_pick_tier_label?: string | null;
  locked_pick_tier_accuracy?: string | null;
  odds?: FixtureOdds | null;
  /** Live-score cache (only populated when status === "live"). */
  live_score?: {
    home_goals: number | null;
    away_goals: number | null;
    /** Elapsed minutes. For HT this is null; for extra time 90+. */
    elapsed: number | null;
    /** Raw API-Football status short code: "1H" / "2H" / "HT" / "ET" / "P". */
    status: string | null;
    halftime_home: number | null;
    halftime_away: number | null;
  } | null;
}

/** ── Lineup / events (API-Football pass-through) ────────────────────── */

export interface LineupPlayer {
  id: number | null;
  name: string;
  number: number | null;
  position: string | null; // "G" / "D" / "M" / "F"
  grid: string | null; // "row:col" on the pitch grid
}

export interface LineupCoach {
  id: number | null;
  name: string | null;
  photo: string | null;
}

export interface TeamLineup {
  team_id: number | null;
  team_name: string | null;
  team_logo: string | null;
  formation: string | null;
  coach: LineupCoach | null;
  starting_xi: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface FixtureLineups {
  fixture_id: string;
  home: TeamLineup | null;
  away: TeamLineup | null;
  available: boolean;
  note: string | null;
}

export interface FixtureEvent {
  minute: number | null;
  extra_minute: number | null;
  team_id: number | null;
  team_name: string | null;
  team_side: "home" | "away" | null;
  player_name: string | null;
  assist_name: string | null;
  type: string | null; // "Goal" | "Card" | "subst" | "Var"
  detail: string | null;
  comments: string | null;
}

export interface FixtureEvents {
  fixture_id: string;
  events: FixtureEvent[];
  available: boolean;
  note: string | null;
}

/** ── Match statistics (API-Football /fixtures/statistics) ──────────── */

export interface FixtureTeamStats {
  shots_on_target: number | null;
  shots_total: number | null;
  corners: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  fouls: number | null;
  offsides: number | null;
  passes_accurate: number | null;
  possession_pct: number | null;
}

export interface FixtureStatistics {
  fixture_id: string;
  home: FixtureTeamStats | null;
  away: FixtureTeamStats | null;
  available: boolean;
  note: string | null;
}

/** ── Injuries (API-Football /injuries?fixture=) ────────────────────── */

export interface FixtureInjury {
  player_name: string | null;
  player_photo: string | null;
  team_id: number | null;
  team_name: string | null;
  team_side: "home" | "away" | null;
  type: string | null;
  reason: string | null;
}

export interface FixtureInjuries {
  fixture_id: string;
  items: FixtureInjury[];
  available: boolean;
  note: string | null;
}

/** ── Standings (API-Football /standings) ───────────────────────────── */

export interface StandingRow {
  position: number | null;
  team_id: number | null;
  team_name: string | null;
  team_logo: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: string | null;
  description: string | null;
  is_home_team: boolean;
  is_away_team: boolean;
}

export interface FixtureStandings {
  fixture_id: string;
  league_name: string | null;
  season: number | null;
  rows: StandingRow[];
  available: boolean;
  note: string | null;
}

/** Response shape of /api/fixtures/{id}/analysis — team form + H2H. */
export interface FixtureAnalysis {
  match: Fixture;
  home_team_form: TeamForm;
  away_team_form: TeamForm;
  head_to_head: {
    total: number;
    home_wins: number;
    draws: number;
    away_wins: number;
    summary: string | null;
  };
}

export interface FixturesResponse {
  date?: string;
  days?: number;
  count: number;
  disclaimer: string;
  fixtures: Fixture[];
}

export interface MatchAnalysis {
  match: Match;
  home_team_form: TeamForm;
  away_team_form: TeamForm;
  head_to_head: {
    total: number;
    home_wins: number;
    draws: number;
    away_wins: number;
    summary: string;
  };
  forecast: ForecastOutput | null;
}

// Dashboard
export interface DashboardMetrics {
  total_forecasts: number;
  evaluated_count: number;
  pending_count: number;
  correct_predictions: number;
  accuracy: number;
  avg_brier_score: number;
  avg_confidence: number;
  has_data: boolean;
  generated_at: string;
  /** v8.1: breakdown by pick_tier; omitted or null when flag is off. */
  per_tier?: Partial<Record<PickTierSlug, TierBreakdown>> | null;
}

// ─── Pricing comparison (public) ─────────────────────────────
/** v8.1: GET /api/pricing/comparison — returned for each of 4 tiers. */
export interface PricingTierData {
  pick_tier: PickTierSlug;
  pick_tier_label: string;
  pick_tier_accuracy: string;
  accuracy_pct: number;
  wilson_ci_lower_pct: number;
  sample_size: number;
  confidence_threshold: number;
  leagues_count: number | null;
  /** INCLUSIVE daily pick count a user of this tier sees. */
  picks_per_day_estimate: number;
}

// Strategies
export interface StrategyRule {
  feature: string;
  operator: string;
  value: number | [number, number];
}

export interface StrategyStaking {
  type: string;
  amount: number;
}

export interface StrategyResponse {
  id: string;
  name: string;
  description: string | null;
  rules: StrategyRule[];
  staking: StrategyStaking;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StrategyPickPrediction {
  id: string;
  match_id: string;
  predicted_at: string;
  home_win_prob: number;
  draw_prob: number | null;
  away_win_prob: number;
  confidence: number;
  prediction_type: string;
  pick: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  home_team_logo?: string | null;
  away_team_logo?: string | null;
  scheduled_at: string | null;
  league_name: string | null;
  match_status: string | null;
  actual_outcome: string | null;
  is_correct: boolean | null;
  home_score: number | null;
  away_score: number | null;
  pnl: number | null;
}

export interface StrategyPicksResponse {
  strategy: StrategyResponse;
  total: number;
  picks: StrategyPickPrediction[];
}

// Admin — pipeline health diagnostic
export type PipelineDiagnosis =
  | "healthy"
  | "no_model"
  | "stale"
  | "partial"
  | "filtered_out"
  | "unknown";

export interface PipelineHealth {
  diagnosis: PipelineDiagnosis;
  message: string;
  active_model_versions: number;
  predictions_last_1h: number;
  predictions_last_24h: number;
  latest_predicted_at: string | null;
  upcoming_matches_7d: number;
  upcoming_with_prediction: number;
  recent_finished_2d: number;
  recent_finished_with_prediction: number;
  upcoming_visible: number;
  recent_finished_visible: number;
  source_breakdown_24h: Record<string, number>;
  post_kickoff_24h: number;
  pre_kickoff_24h: number;
}

export interface GeneratePredictionsResult {
  total_matches: number;
  predictions_generated: number;
  errors: number;
  details: string[];
}

export interface SchedulerJob {
  id: string;
  name: string;
  trigger: string;
  next_run_time: string | null;
  pending: boolean;
}

export interface SchedulerStatus {
  running: boolean;
  jobs: SchedulerJob[];
}

export interface JobTriggerResponse {
  triggered: string;
  ok: boolean;
  detail?: string | null;
}

export interface IngestionDiagnosis {
  league: string;
  ok: boolean;
  created: number;
  updated: number;
  errors: number;
  matches_returned_by_api: number;
  error_type?: string | null;
  error_message?: string | null;
}

export interface MatchStatusByDate {
  day: string;
  status: string;
  count: number;
}

export interface MatchStatusBreakdown {
  days_back: number;
  rows: MatchStatusByDate[];
  totals_by_status: Record<string, number>;
  stuck_scheduled_past_kickoff: number;
  last_finished_match_day: string | null;
}

export interface PredictionGenerationTest {
  match_id?: string | null;
  league?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  scheduled_at?: string | null;
  ok: boolean;
  prediction_id?: string | null;
  confidence?: number | null;
  error_type?: string | null;
  error_message?: string | null;
  traceback?: string | null;
}

// Capacity plan (GET /api/admin/capacity-plan)
export type CapacityStatus = "safe" | "watch" | "tight" | "over";

export interface CapacityScenario {
  users: number;
  projected_daily_calls: number;
  pct_of_limit: number;
  status: CapacityStatus;
}

export interface CapacityEndpointRow {
  endpoint: string;
  calls: number;
}

export interface CapacityDaily {
  day: string;
  calls: number;
}

export interface CapacityPlan {
  as_of: string;
  provider: string;
  plan: {
    name: string;
    daily_limit: number;
    upgrade_target: {
      name: string;
      daily_limit: number;
      price_usd_month: number;
    } | null;
  };
  usage: {
    today_calls: number;
    pct_of_limit_today: number;
    last_7d_calls: number;
    avg_daily_last_7d: number;
    series_7d: CapacityDaily[];
  };
  user_base: {
    active_last_7d: number;
    total_active: number;
    effective: number;
    calls_per_user_per_day: number;
  };
  top_endpoints_24h: CapacityEndpointRow[];
  top_endpoints_7d: CapacityEndpointRow[];
  scenarios: CapacityScenario[];
  projection: {
    break_even_users: number | null;
    headroom_users: number | null;
  };
  verdict: CapacityStatus;
}

// Blog
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string | null;
  featured_image_url: string | null;
  status: "draft" | "published" | "archived";
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostCreate {
  title: string;
  slug?: string;
  content: string;
  meta_description?: string;
  featured_image_url?: string;
  status?: "draft" | "published" | "archived";
}

export interface BlogPostUpdate {
  title?: string;
  slug?: string;
  content?: string;
  meta_description?: string;
  featured_image_url?: string;
  status?: "draft" | "published" | "archived";
}

// Admin Users
export interface AdminUserSubscription {
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
  is_lifetime: boolean;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export interface AdminUserPayment {
  last_amount: number | null;
  currency: string | null;
  last_payment_at: string | null;
  last_payment_status: string | null;
  total_paid: number;
  payments_count: number;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  subscription: AdminUserSubscription | null;
  payment: AdminUserPayment | null;
}

// Site Settings
export interface SiteSettings {
  [key: string]: string;
}

// SEO Audit
export interface PageSeoScore {
  path: string;
  title: string;
  title_length: number;
  title_score: "good" | "needs_improvement" | "poor";
  meta_description: string;
  meta_length: number;
  meta_score: "good" | "needs_improvement" | "poor";
  has_og_tags: boolean;
  has_schema: boolean;
  overall_score: number;
}

// ─── Combi van de Dag — 3-leg accumulator (Platinum-only) ────────────────────

export interface ComboLeg {
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  league_id: string;
  scheduled_at: string;
  our_pick: "home" | "draw" | "away";
  our_pick_label: string;
  our_probability: number;
  bookmaker_implied: number;
  fair_implied: number;
  leg_odds: number;
  leg_edge: number;
  confidence: number;
  prediction_tier: "gold" | "platinum";
}

export interface ComboOfTheDay {
  available: boolean;
  reason?: string;
  bet_date?: string;
  legs: ComboLeg[];
  combined_odds: number;
  combined_model_probability: number;
  combined_bookmaker_implied: number;
  combined_edge: number;
  expected_value_per_unit: number;
  requires_tier: "platinum";
  locked: boolean;
  coming_soon: boolean;
  disclaimer?: string;
}

export interface ComboStats {
  scope: "backtest" | "live";
  window_start: string;
  window_end: string;
  total_combos: number;
  evaluated_combos: number;
  hit_combos: number;
  accuracy: number;
  avg_combined_odds: number;
  avg_legs_per_combo: number;
  total_units_pnl: number;
  roi_percentage: number;
  wilson_ci_lower: number;
  wilson_ci_upper: number;
  sample_size_warning: boolean;
  explainer: string;
}

export interface ComboHistoryItem {
  id: string;
  bet_date: string;
  is_live: boolean;
  is_evaluated: boolean;
  is_correct: boolean | null;
  leg_count: number;
  combined_odds: number;
  combined_edge: number;
  profit_loss_units: number | null;
  leg_summary: string;
}

// ─── Value Bet engine (v9) ──────────────────────────────────────────────────

export interface ValueBetToday {
  available: boolean;
  reason?: string;
  bet_date?: string;
  match_id?: string;
  home_team?: string;
  away_team?: string;
  league?: string;
  scheduled_at?: string;
  our_pick?: "home" | "draw" | "away";
  our_probability?: number;
  bookmaker_implied?: number;
  fair_implied?: number;
  edge?: number;
  expected_value?: number;
  best_odds?: number;
  odds_source?: string;
  our_confidence?: number;
  prediction_tier?: "free" | "silver" | "gold" | "platinum";
  prediction_tier_label?: string;
  is_live?: boolean;
  disclaimer?: string;
}

export interface ValueBetStats {
  scope: "all" | "live" | "backtest";
  total_picks: number;
  evaluated_picks: number;
  correct_picks: number;
  accuracy: number;
  avg_odds: number;
  avg_edge: number;
  total_units_pnl: number;
  roi_percentage: number;
  max_drawdown_units: number;
  sharpe_ratio: number | null;
  wilson_ci_lower: number;
  wilson_ci_upper: number;
  sample_size_warning: boolean;
  window_start?: string;
  window_end?: string;
}

export interface ValueBetHistoryItem {
  id: string;
  bet_date: string;
  picked_at: string;
  home_team: string;
  away_team: string;
  league: string;
  our_pick: "home" | "draw" | "away";
  best_odds: number;
  edge: number;
  expected_value: number;
  prediction_tier?: "free" | "silver" | "gold" | "platinum";
  is_live: boolean;
  is_evaluated: boolean;
  is_correct?: boolean | null;
  profit_loss_units?: number | null;
}

export interface ValueBetHistoryResponse {
  total: number;
  items: ValueBetHistoryItem[];
}

export interface BacktestProofSlice {
  label: string;
  n: number;
  accuracy: number;
  wilson_ci_lower: number;
  wilson_ci_upper: number;
  avg_odds: number;
  roi_percentage: number;
  total_units_pnl: number;
  max_drawdown_units: number;
  sharpe_ratio: number | null;
}

export interface BacktestSampleFunnel {
  total_live_predictions: number;
  live_predictions_evaluated: number;
  live_predictions_with_odds_snapshot: number;
  live_evaluated_with_odds: number;
  odds_pipeline_start: string;
}

export interface BacktestProofMatch {
  scheduled_at?: string;
  league?: string;
  home_team?: string;
  away_team?: string;
  pick: "home" | "draw" | "away";
  best_odds: number;
  edge: number;
  tier?: "free" | "silver" | "gold" | "platinum";
  is_correct: boolean;
  actual_outcome?: string;
  profit_loss_units: number;
}

export interface BacktestProof {
  methodology: string;
  sample_window_start?: string;
  sample_window_end?: string;
  total_live_evaluated_with_odds: number;
  funnel: BacktestSampleFunnel;
  slices: BacktestProofSlice[];
  accuracy_only_slice: BacktestProofSlice;
  matches: BacktestProofMatch[];
  disclaimer: string;
}
