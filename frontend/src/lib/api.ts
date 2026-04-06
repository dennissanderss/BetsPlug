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
}

export const api = new ApiClient(API_BASE);
