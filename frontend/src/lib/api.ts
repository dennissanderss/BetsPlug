const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || `API error: ${res.status}`);
    }
    return res.json();
  }

  // Search
  search(q: string, sport?: string, limit = 20) {
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (sport) params.set("sport", sport);
    return this.request<{ groups: import("@/types/api").SearchResultGroup[] }>(
      `/search?${params}`
    );
  }

  // Sports
  getSports() {
    return this.request<import("@/types/api").Sport[]>("/sports");
  }

  // Leagues
  getLeagues(sportId?: string) {
    const params = sportId ? `?sport_id=${sportId}` : "";
    return this.request<import("@/types/api").League[]>(`/leagues${params}`);
  }
  getLeague(id: string) {
    return this.request<import("@/types/api").League>(`/leagues/${id}`);
  }
  getLeagueMatches(id: string, limit = 20, offset = 0) {
    return this.request<import("@/types/api").Match[]>(
      `/leagues/${id}/matches?limit=${limit}&offset=${offset}`
    );
  }

  // Teams
  getTeam(id: string) {
    return this.request<import("@/types/api").TeamDetail>(`/teams/${id}`);
  }
  getTeamMatches(id: string, limit = 20) {
    return this.request<import("@/types/api").Match[]>(
      `/teams/${id}/matches?limit=${limit}`
    );
  }
  getTeamForm(id: string) {
    return this.request<import("@/types/api").TeamForm>(`/teams/${id}/form`);
  }
  getTeamStats(id: string) {
    return this.request<import("@/types/api").TeamStatsData>(
      `/teams/${id}/stats`
    );
  }

  // Matches
  getMatch(id: string) {
    return this.request<import("@/types/api").Match>(`/matches/${id}`);
  }
  getMatchAnalysis(id: string) {
    return this.request<import("@/types/api").MatchAnalysis>(
      `/matches/${id}/analysis`
    );
  }
  getMatchForecast(id: string) {
    return this.request<import("@/types/api").ForecastOutput>(
      `/matches/${id}/forecast`
    );
  }

  // Predictions
  getPredictions(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<import("@/types/api").PaginatedResponse<import("@/types/api").Prediction>>(
      `/predictions${qs}`
    );
  }
  getPrediction(id: string) {
    return this.request<import("@/types/api").Prediction>(`/predictions/${id}`);
  }
  runPrediction(matchId: string) {
    return this.request<import("@/types/api").ForecastOutput>(
      "/predictions/run",
      { method: "POST", body: JSON.stringify({ match_id: matchId }) }
    );
  }

  // Trackrecord
  getTrackrecordSummary(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<import("@/types/api").TrackrecordSummary>(
      `/trackrecord/summary${qs}`
    );
  }
  getTrackrecordSegments(groupBy: string, params?: Record<string, string>) {
    const qs = new URLSearchParams({ group_by: groupBy, ...params });
    return this.request<import("@/types/api").SegmentPerformance[]>(
      `/trackrecord/segments?${qs}`
    );
  }
  getCalibration(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<import("@/types/api").CalibrationBucket[]>(
      `/trackrecord/calibration${qs}`
    );
  }

  // Backtests
  getBacktests() {
    return this.request<import("@/types/api").BacktestRun[]>("/backtests");
  }
  getBacktest(id: string) {
    return this.request<import("@/types/api").BacktestRun>(`/backtests/${id}`);
  }
  runBacktest(config: Record<string, unknown>) {
    return this.request<import("@/types/api").BacktestRun>("/backtests/run", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  // Reports
  getReports() {
    return this.request<import("@/types/api").GeneratedReport[]>("/reports");
  }
  getReport(id: string) {
    return this.request<import("@/types/api").GeneratedReport>(`/reports/${id}`);
  }
  generateReport(config: Record<string, unknown>) {
    return this.request<import("@/types/api").ReportJob>("/reports/generate", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }
  getReportDownloadUrl(id: string) {
    return `${this.baseUrl}/reports/${id}/download`;
  }

  // Admin
  getDataSources() {
    return this.request<import("@/types/api").DataSourceHealth[]>(
      "/admin/data-sources"
    );
  }
  getIngestionRuns(limit = 50) {
    return this.request<import("@/types/api").IngestionRun[]>(
      `/admin/ingestion-runs?limit=${limit}`
    );
  }
  getAdminErrors(limit = 50) {
    return this.request<Record<string, unknown>[]>(
      `/admin/errors?limit=${limit}`
    );
  }
  triggerSync(sourceId?: string) {
    return this.request<Record<string, string>>("/admin/sync", {
      method: "POST",
      body: JSON.stringify(sourceId ? { source_id: sourceId } : {}),
    });
  }
  triggerRetrain(modelType?: string) {
    return this.request<Record<string, string>>("/admin/retrain", {
      method: "POST",
      body: JSON.stringify(modelType ? { model_type: modelType } : {}),
    });
  }

  // Fixture Results
  getFixtureResults(days = 7, league?: string) {
    const params = new URLSearchParams({ days: String(days) });
    if (league) params.set("league_slug", league);
    return this.request<import("@/types/api").FixturesResponse>(
      `/fixtures/results?${params}`
    );
  }
  getWeeklySummary() {
    return this.request<import("@/types/api").WeeklySummary>(
      "/fixtures/results/weekly-summary"
    );
  }
  getFixturesToday() {
    return this.request<import("@/types/api").FixturesResponse>("/fixtures/today");
  }
  getFixturesUpcoming(days = 7) {
    return this.request<import("@/types/api").FixturesResponse>(
      `/fixtures/upcoming?days=${days}`
    );
  }

  // Live matches
  getLiveToday() {
    return this.request<{
      status: string;
      count: number;
      matches: import("@/types/api").LiveMatch[];
    }>("/live/today");
  }
  getLiveUpcoming(days = 3) {
    return this.request<{
      status: string;
      count: number;
      matches: import("@/types/api").LiveMatch[];
    }>(`/live/upcoming?days=${days}`);
  }

  // Health
  getHealth() {
    return this.request<{ status: string; version: string }>("/health");
  }

  // Bet of the Day
  getBetOfTheDay(targetDate?: string) {
    const params = targetDate ? `?target_date=${targetDate}` : "";
    return this.request<{
      available: boolean;
      match_id?: string;
      home_team?: string;
      away_team?: string;
      league?: string;
      scheduled_at?: string;
      home_win_prob?: number;
      draw_prob?: number;
      away_win_prob?: number;
      confidence?: number;
      predicted_outcome?: string;
      explanation_summary?: string;
      prediction_id?: string;
    }>(`/bet-of-the-day/${params}`);
  }

  // Subscriptions
  getSubscriptionPlans() {
    return this.request<{
      id: string;
      name: string;
      price_monthly: number;
      price_total: number;
      duration_months: number;
      features: string[];
    }[]>("/subscriptions/plans");
  }

  createCheckout(plan: string, successUrl: string, cancelUrl: string) {
    return this.request<{ checkout_url: string; session_id: string }>(
      "/subscriptions/create-checkout",
      {
        method: "POST",
        body: JSON.stringify({
          plan,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      }
    );
  }

  getSubscriptionStatus() {
    return this.request<{
      has_subscription: boolean;
      plan: string | null;
      status: string | null;
      is_lifetime: boolean;
      current_period_end: string | null;
    }>("/subscriptions/status");
  }

  // Dashboard
  getDashboardMetrics() {
    return this.request<import("@/types/api").DashboardMetrics>("/dashboard/metrics");
  }

  // Strategies
  getStrategies(activeOnly = false) {
    const qs = activeOnly ? "?active_only=true" : "";
    return this.request<import("@/types/api").StrategyResponse[]>(`/strategies/${qs}`);
  }
  getStrategyPicks(id: string, limit = 50, offset = 0) {
    return this.request<import("@/types/api").StrategyPicksResponse>(
      `/strategies/${id}/picks?limit=${limit}&offset=${offset}`
    );
  }

  // Admin Blog
  getAdminBlogPosts(status?: string, limit = 50, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (status) params.set("status", status);
    return this.request<import("@/types/api").BlogPost[]>(`/admin/blog/?${params}`);
  }
  createBlogPost(data: import("@/types/api").BlogPostCreate) {
    return this.request<import("@/types/api").BlogPost>("/admin/blog", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  updateBlogPost(id: string, data: import("@/types/api").BlogPostUpdate) {
    return this.request<import("@/types/api").BlogPost>(`/admin/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  deleteBlogPost(id: string) {
    return this.request<{ ok: boolean }>(`/admin/blog/${id}`, { method: "DELETE" });
  }

  // Admin Users
  getAdminUsers(limit = 50, offset = 0) {
    return this.request<import("@/types/api").AdminUser[]>(
      `/admin/users/?limit=${limit}&offset=${offset}`
    );
  }
  updateAdminUserStatus(userId: string, isActive: boolean) {
    return this.request<import("@/types/api").AdminUser>(`/admin/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  // Admin Settings
  getAdminSettings() {
    return this.request<import("@/types/api").SiteSettings>("/admin/settings/");
  }
  updateAdminSettings(settings: Record<string, string>) {
    return this.request<import("@/types/api").SiteSettings>("/admin/settings/", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  // Admin SEO
  getAdminSeoAudit() {
    return this.request<import("@/types/api").PageSeoScore[]>("/admin/seo/audit");
  }
}

export const api = new ApiClient(API_BASE);
