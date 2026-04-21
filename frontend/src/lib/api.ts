const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/* ── LocalStorage keys (shared with auth.tsx) ──────────────── */
const TOKEN_KEY = "betsplug_token";
const USER_KEY = "betsplug_user";
const TIER_KEY = "betsplug_tier";
const ADMIN_TESTING_TIER_KEY = "betsplug_admin_testing_tier";

const ADMIN_TIER_SLUGS = new Set(["free", "silver", "gold", "platinum"]);

/**
 * Read the admin "test as tier" override from localStorage.
 *
 * The admin panel has a `TierSwitcher` widget (see
 * `app/(app)/admin/page.tsx`) that writes the chosen tier slug to
 * `betsplug_admin_testing_tier`. We mirror that value here so every
 * outgoing API request can append `?tier=<slug>` — the backend
 * dependency `get_current_tier` (backend/app/auth/tier.py) accepts
 * the override ONLY when the caller is an authenticated admin, so
 * sending the param for non-admins is a harmless no-op.
 *
 * Returns null unless both conditions hold:
 *   - The stored user in localStorage has role === "admin"
 *   - `betsplug_admin_testing_tier` contains a known tier slug
 */
function readAdminTestingTier(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const rawUser = window.localStorage.getItem(USER_KEY);
    if (!rawUser) return null;
    const user = JSON.parse(rawUser);
    if (user?.role !== "admin") return null;
    const slug = window.localStorage.getItem(ADMIN_TESTING_TIER_KEY);
    if (!slug) return null;
    const lower = slug.toLowerCase();
    if (!ADMIN_TIER_SLUGS.has(lower)) return null;
    return lower;
  } catch {
    return null;
  }
}

/**
 * Append `?tier=<slug>` (or `&tier=<slug>` when a querystring is
 * already present) to a path. No-op when `slug` is null.
 *
 * Kept in one place so the behavior stays consistent for `request()`
 * (JSON endpoints) AND the URL-builder helpers like
 * `getTrackrecordExportUrl()` / `getReportDownloadUrl()` which return
 * raw URLs for `<a href>` downloads.
 */
function withAdminTier(path: string, slug: string | null): string {
  if (!slug) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}tier=${encodeURIComponent(slug)}`;
}

/**
 * Custom error that exposes the HTTP status code alongside the
 * human-readable detail. Callers can discriminate on
 * `err.status === 403` to e.g. surface a "resend verification"
 * CTA on the login page.
 */
export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Read the current auth token. We go through localStorage
 * directly so non-React code (e.g. server-action fetchers) can
 * still benefit from auto-auth.
 */
function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * On 401 the server is telling us the token has expired or was
 * revoked. Clear every auth-related key, emit a `auth:expired`
 * event so the <AuthProvider> can react, and let the caller
 * handle the thrown error. We intentionally do NOT redirect
 * here — the event listener in AuthProvider decides where to go
 * which keeps this module testable.
 */
function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(TIER_KEY);
  } catch {
    // Ignore storage failures.
  }
  try {
    window.dispatchEvent(new CustomEvent("auth:expired"));
  } catch {
    // Ignore: older browsers without CustomEvent constructor.
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    // Admin "test as tier" override — see readAdminTestingTier() docs.
    // We inject the query param here so every authenticated fetch
    // reaches the backend with the correct tier context; without it
    // the backend falls back to the admin's own subscription, which
    // causes the frontend (reading `betsplug_tier` from localStorage)
    // to receive data that doesn't match its expected scope and
    // surfaces as a React error boundary crash.
    const url = `${this.baseUrl}${withAdminTier(path, readAdminTestingTier())}`;

    // Build headers with auto-attached bearer token. We do NOT
    // force JSON content-type when the caller supplied their own
    // (e.g. login's form-url-encoded body).
    const headers: Record<string, string> = {};
    const incoming = options?.headers as Record<string, string> | undefined;
    const hasCustomContentType =
      incoming &&
      Object.keys(incoming).some((k) => k.toLowerCase() === "content-type");
    if (!hasCustomContentType) {
      headers["Content-Type"] = "application/json";
    }
    if (incoming) {
      Object.assign(headers, incoming);
    }
    const token = readToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      handleUnauthorized();
      throw new ApiError(401, "unauthorized");
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      const detail =
        typeof body?.detail === "string"
          ? body.detail
          : body?.detail?.message || `API error: ${res.status}`;
      throw new ApiError(res.status, detail);
    }

    // 204 No Content
    if (res.status === 204) {
      return undefined as T;
    }
    return res.json();
  }

  /* ── Authentication ──────────────────────────────────────── */

  /**
   * Log in via OAuth2PasswordRequestForm. The backend expects
   * `application/x-www-form-urlencoded` with `username` +
   * `password` fields — the username may actually be an email
   * address.
   */
  login(username: string, password: string) {
    const body = new URLSearchParams();
    body.set("username", username);
    body.set("password", password);
    return this.request<import("@/types/api").AuthTokenResponse>(
      "/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }
    );
  }

  register(input: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
  }) {
    // Register now returns the full login shape (access_token + user)
    // plus a `message` field describing the verification-email status,
    // so the frontend can auto-login and skip the old "check your
    // inbox, then go back to login" friction loop.
    return this.request<
      import("@/types/api").AuthTokenResponse & { message: string }
    >("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getMe() {
    return this.request<import("@/types/api").User>("/auth/me");
  }

  verifyEmail(token: string) {
    return this.request<import("@/types/api").AuthTokenResponse>(
      "/auth/verify-email",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      }
    );
  }

  resendVerification(email: string) {
    return this.request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  forgotPassword(email: string) {
    return this.request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  resetPassword(token: string, new_password: string) {
    return this.request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    });
  }

  /* ── Current-user subscription ────────────────────────────── */

  getMySubscription() {
    return this.request<import("@/types/api").MySubscription>(
      "/subscriptions/me"
    );
  }

  cancelMySubscription() {
    return this.request<import("@/types/api").MySubscription>(
      "/subscriptions/me/cancel",
      { method: "POST" }
    );
  }

  /* ── Admin Finance ────────────────────────────────────────── */

  adminFinanceOverview(params?: { period?: string; months?: number }) {
    const qs = new URLSearchParams();
    if (params?.period) qs.set("period", params.period);
    if (typeof params?.months === "number")
      qs.set("months", String(params.months));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return this.request<import("@/types/api").FinanceOverview>(
      `/admin/finance/overview${suffix}`
    );
  }

  adminListExpenses() {
    return this.request<import("@/types/api").AdminExpense[]>(
      "/admin/finance/expenses"
    );
  }

  adminCreateExpense(input: {
    amount: number;
    currency: string;
    description: string;
    category: string;
    expense_date: string;
    notes?: string;
  }) {
    return this.request<import("@/types/api").AdminExpense>(
      "/admin/finance/expenses",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  }

  adminUpdateExpense(
    id: string,
    input: {
      amount: number;
      currency: string;
      description: string;
      category: string;
      expense_date: string;
      notes?: string;
    }
  ) {
    return this.request<import("@/types/api").AdminExpense>(
      `/admin/finance/expenses/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      }
    );
  }

  adminDeleteExpense(id: string) {
    return this.request<{ status: string; id: string }>(
      `/admin/finance/expenses/${id}`,
      { method: "DELETE" }
    );
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

  // Matches — backed by /fixtures/{id} (same shape as the list endpoints,
  // avoids the legacy /matches/{id} path which has schema drift issues).
  getFixtureDetail(id: string) {
    return this.request<import("@/types/api").Fixture>(`/fixtures/${id}`);
  }
  getFixtureAnalysis(id: string) {
    return this.request<import("@/types/api").FixtureAnalysis>(
      `/fixtures/${id}/analysis`
    );
  }
  getFixtureLineup(id: string) {
    return this.request<import("@/types/api").FixtureLineups>(
      `/fixtures/${id}/lineup`
    );
  }
  getFixtureEvents(id: string) {
    return this.request<import("@/types/api").FixtureEvents>(
      `/fixtures/${id}/events`
    );
  }
  getFixtureStatistics(id: string) {
    return this.request<import("@/types/api").FixtureStatistics>(
      `/fixtures/${id}/statistics`
    );
  }
  getFixtureInjuries(id: string) {
    return this.request<import("@/types/api").FixtureInjuries>(
      `/fixtures/${id}/injuries`
    );
  }
  getFixtureStandings(id: string) {
    return this.request<import("@/types/api").FixtureStandings>(
      `/fixtures/${id}/standings`
    );
  }

  // Predictions — trailing slash required: FastAPI redirects /predictions → /predictions/
  // (307), but Railway's CDN downgrades the redirect to HTTP which browsers
  // block as mixed content. Using /predictions/ avoids the redirect entirely.
  getPredictions(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<import("@/types/api").PaginatedResponse<import("@/types/api").Prediction>>(
      `/predictions/${qs}`
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

  // Models (v6.2 transparency)
  getModels(activeOnly = true) {
    const qs = `?active_only=${activeOnly ? "true" : "false"}`;
    return this.request<import("@/types/api").ModelOverview[]>(`/models${qs}`);
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
    // v6.2: backend returns the full CalibrationReport object (with
    // a buckets array inside), NOT a bare array. The old typing was
    // wrong and hid the mismatch when the endpoint was 404'ing.
    return this.request<import("@/types/api").CalibrationReport>(
      `/trackrecord/calibration${qs}`
    );
  }
  /**
   * v6.2.1: resolve the trackrecord CSV export URL so a plain <a href>
   * download link can use it. We return the URL rather than a fetched
   * Blob so browsers handle the filename + progress indicator natively.
   */
  getTrackrecordExportUrl(
    modelVersionId?: string,
    pickTier?: string,
  ): string {
    const params: Record<string, string> = {};
    if (modelVersionId) params.model_version_id = modelVersionId;
    if (pickTier) params.pick_tier = pickTier;
    const qs = Object.keys(params).length
      ? `?${new URLSearchParams(params)}`
      : "";
    const path = withAdminTier(`/trackrecord/export.csv${qs}`, readAdminTestingTier());
    return `${this.baseUrl}${path}`;
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

  // Reports — trailing slash required: FastAPI redirects /reports → /reports/
  // (307), but Railway's CDN downgrades the redirect to HTTP which browsers
  // block as mixed content. Using /reports/ avoids the redirect entirely.
  getReports() {
    return this.request<import("@/types/api").GeneratedReport[]>("/reports/");
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
    const path = withAdminTier(`/reports/${id}/download`, readAdminTestingTier());
    return `${this.baseUrl}${path}`;
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
  getPipelineHealth() {
    return this.request<import("@/types/api").PipelineHealth>(
      "/admin/pipeline-health"
    );
  }
  getCapacityPlan() {
    return this.request<import("@/types/api").CapacityPlan>(
      "/admin/capacity-plan"
    );
  }
  runGeneratePredictions(days = 7) {
    return this.request<import("@/types/api").GeneratePredictionsResult>(
      "/admin/generate-predictions",
      { method: "POST", body: JSON.stringify({ days }) },
    );
  }
  getSchedulerStatus() {
    return this.request<import("@/types/api").SchedulerStatus>(
      "/admin/scheduler-status"
    );
  }
  triggerSchedulerJob(jobId: string) {
    return this.request<import("@/types/api").JobTriggerResponse>(
      `/admin/trigger-job?job_id=${encodeURIComponent(jobId)}`,
      { method: "POST" },
    );
  }
  diagnoseIngestion(leagueSlug: string) {
    return this.request<import("@/types/api").IngestionDiagnosis>(
      `/admin/diagnose-ingestion?league_slug=${encodeURIComponent(leagueSlug)}`,
      { method: "POST" },
    );
  }
  getMatchStatusBreakdown(daysBack = 14) {
    return this.request<import("@/types/api").MatchStatusBreakdown>(
      `/admin/match-status-breakdown?days_back=${daysBack}`,
    );
  }
  testPredictionGeneration() {
    return this.request<import("@/types/api").PredictionGenerationTest>(
      "/admin/test-prediction-generation",
      { method: "POST" },
    );
  }

  botdBackfillMissed() {
    return this.request<{ backfilled: number; dates: string[] }>(
      "/admin/botd/backfill-missed",
      { method: "POST" },
    );
  }

  // Fixture Results
  getFixtureResults(days = 7, league?: string) {
    const params = new URLSearchParams({ days: String(days) });
    if (league) params.set("league_slug", league);
    return this.request<import("@/types/api").FixturesResponse>(
      `/fixtures/results?${params}`
    );
  }
  getWeeklySummary(days = 7, pickTier?: string) {
    const qs = new URLSearchParams({ days: String(days) });
    if (pickTier) qs.set("pick_tier", pickTier);
    return this.request<import("@/types/api").WeeklySummary>(
      `/fixtures/results/weekly-summary?${qs}`
    );
  }
  getFixturesToday() {
    return this.request<import("@/types/api").FixturesResponse>("/fixtures/today");
  }
  getFixturesUpcoming(days = 7, leagueSlug?: string) {
    const params = new URLSearchParams({ days: String(days) });
    if (leagueSlug) params.set("league_slug", leagueSlug);
    return this.request<import("@/types/api").FixturesResponse>(
      `/fixtures/upcoming?${params}`
    );
  }
  // v6.2: live matches — matches currently flagged as status=LIVE in the DB.
  getFixturesLive(leagueSlug?: string) {
    const params = new URLSearchParams();
    if (leagueSlug) params.set("league_slug", leagueSlug);
    const qs = params.toString() ? `?${params}` : "";
    return this.request<import("@/types/api").FixturesResponse>(
      `/fixtures/live${qs}`
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

  // Homepage
  getFreePicks() {
    return this.request<import("@/types/api").FreePicksResponse>("/homepage/free-picks");
  }

  // Health
  getHealth() {
    return this.request<{ status: string; version: string }>("/health");
  }

  // Pick of the Day
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

  // v8.1 — public pricing/tier comparison (used by /pricing and /engine)
  getPricingComparison() {
    return this.request<import("@/types/api").PricingTierData[]>(
      "/pricing/comparison",
    );
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
  getStrategyTodayPicks(id: string) {
    return this.request<{ strategy_name: string; picks_count: number; picks: any[] }>(
      `/strategies/${id}/today-picks`
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
  getAdminUsers(limit = 200, offset = 0) {
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
  deleteAdminUser(userId: string) {
    return this.request<{
      id: string;
      email: string;
      deleted_subscriptions: number;
      deleted_payments: number;
      message: string;
    }>(`/admin/users/${userId}`, { method: "DELETE" });
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

  // Admin Goals
  getAdminGoals() {
    return this.request<any[]>("/admin/goals/");
  }
  createAdminGoal(data: { title: string; description?: string; priority?: number; due_date?: string }) {
    return this.request<any>("/admin/goals/", { method: "POST", body: JSON.stringify(data) });
  }
  updateAdminGoal(id: string, data: any) {
    return this.request<any>(`/admin/goals/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }
  deleteAdminGoal(id: string) {
    return this.request<any>(`/admin/goals/${id}`, { method: "DELETE" });
  }

  // Admin Notes
  getAdminNotes() {
    return this.request<any[]>("/admin/notes/");
  }
  createAdminNote(data: { content: string; category?: string }) {
    return this.request<any>("/admin/notes/", { method: "POST", body: JSON.stringify(data) });
  }
  deleteAdminNote(id: string) {
    return this.request<any>(`/admin/notes/${id}`, { method: "DELETE" });
  }

  // ── Admin Diagnostics (SMTP test, user search, password-reset link) ──
  //
  // These wrap the `/auth/admin/*` endpoints used by the Email Diagnostics
  // tab in the admin panel. Every endpoint requires an admin JWT.

  getAdminSmtpConfig() {
    return this.request<{
      smtp_host: string;
      smtp_port: number;
      smtp_user: string;
      smtp_from: string;
      smtp_use_tls: boolean;
      effective_mode: string;
      password_set: boolean;
    }>("/auth/admin/smtp-config");
  }

  adminTestEmail(to: string) {
    return this.request<{
      success: boolean;
      error_type: string | null;
      error_message: string | null;
      duration_ms: number;
      config: {
        smtp_host: string;
        smtp_port: number;
        smtp_user: string;
        smtp_from: string;
        smtp_use_tls: boolean;
        effective_mode: string;
        password_set: boolean;
      };
    }>("/auth/admin/test-email", {
      method: "POST",
      body: JSON.stringify({ to }),
    });
  }

  adminFindUsers(q: string) {
    return this.request<
      Array<{
        id: string;
        email: string;
        username: string;
        role: string;
        email_verified: boolean;
        is_active: boolean;
        created_at: string | null;
        last_login_at: string | null;
      }>
    >(`/auth/admin/find-users?q=${encodeURIComponent(q)}`);
  }

  adminGetPasswordResetLink(email: string) {
    return this.request<{
      user_id: string;
      email: string;
      reset_url: string;
      expires_at: string;
    }>(`/auth/admin/password-reset-link/${encodeURIComponent(email)}`);
  }

  adminGetVerificationLink(email: string) {
    return this.request<{
      user_id: string;
      email: string;
      email_verified: boolean;
      verification_url: string | null;
      verification_sent_at: string | null;
    }>(`/auth/admin/verification-link/${encodeURIComponent(email)}`);
  }

  adminResendVerification(email: string) {
    return this.request<{ message: string }>(
      `/auth/admin/resend-verification/${encodeURIComponent(email)}`,
      { method: "POST" }
    );
  }

  adminForceVerifyUser(email: string) {
    return this.request<import("@/types/api").AdminUser>(
      `/auth/admin/verify-user/${encodeURIComponent(email)}`,
      { method: "POST" }
    );
  }
}

export const api = new ApiClient(API_BASE);
