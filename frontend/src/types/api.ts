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
}

export interface FinanceOverview {
  range_start: string;
  range_end: string;
  granularity: "day" | "week" | "month";
  total_revenue: number;
  total_expenses: number;
  total_profit: number;
  currency: string;
  timeline: FinancePoint[];
  by_plan: Record<string, number>;
  expenses_by_category: Record<string, number>;
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

export interface Prediction {
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

export interface BetOfTheDayResponse {
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
}

export interface PredictionEvaluation {
  actual_outcome: string;
  is_correct: boolean;
  brier_score: number;
  log_loss: number | null;
  evaluated_at: string;
}

export interface TrackrecordSummary {
  total_predictions: number;
  accuracy: number;
  brier_score: number;
  log_loss: number;
  avg_confidence: number;
  calibration_error: number;
  period_start: string | null;
  period_end: string | null;
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
  league: string;
  scheduled_at: string;
  pick: string;
  home_win_prob: number;
  draw_prob: number | null;
  away_win_prob: number;
  confidence: number;
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
  confidence: number;
  model_name: string | null;
  predicted_at?: string;
  pick?: string | null;
  reasoning?: string | null;
  edge?: Record<string, number> | null;
  implied_probabilities?: Record<string, number> | null;
  top_features?: Array<{ feature: string; importance: number }> | null;
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
  away_team_id?: string;
  away_team_name: string;
  away_team_slug: string;
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
  odds?: FixtureOdds | null;
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
