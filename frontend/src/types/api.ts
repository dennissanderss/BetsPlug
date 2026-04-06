// ============================================
// Sports Intelligence Platform - API Types
// ============================================

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
  explanation: PredictionExplanation | null;
  evaluation: PredictionEvaluation | null;
  match: Match | null;
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
  bucket_start: number;
  bucket_end: number;
  predicted_prob: number;
  actual_freq: number;
  count: number;
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
  type: "sport" | "league" | "team" | "match";
  name: string;
  subtitle: string | null;
  slug: string;
}

export interface SearchResultGroup {
  type: string;
  items: SearchResult[];
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
