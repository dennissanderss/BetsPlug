# Abandoned Checkout Email Flow - Technical Documentation

> **Date:** 2026-04-10  
> **Status:** Implemented, ready for deployment  
> **Author:** AI-assisted implementation

---

## 1. Technische keuze (samenvatting)

De abandoned checkout flow detecteert onvoltooide checkouts, stuurt exact 1 herinneringsmail met een unieke 5% kortingscode, en biedt een recovery-link om direct verder te gaan waar de gebruiker was gestopt.

**Stack:** PostgreSQL (sessie + coupon opslag) + Celery Beat (elke 30 min scheduled scan) + Hostinger SMTP (transactionele email) + fire-and-forget frontend tracking.

---

## 2. Waarom deze aanpak

| Criterium | Keuze | Reden |
|-----------|-------|-------|
| **Trigger** | Celery Beat (elke 30 min) | Betrouwbaar, idempotent, geen externe API-afhankelijkheid. Vercel cron is onbetrouwbaar voor minutennauwkeurige taken. |
| **Email transport** | Python `smtplib` + Hostinger SMTP | Geen extra kosten (Hostinger-hosting al beschikbaar), SSL op poort 465, geen vendor lock-in. |
| **Tracking** | Fire-and-forget `fetch()` calls | Checkout UX wordt NOOIT geblokkeerd door API-fouten. Sessies worden asynchroon opgeslagen. |
| **Deduplicatie** | DB `WHERE status='started' AND abandoned_email_sent_at IS NULL` | Garandeert exact 1 email per sessie, zelfs bij concurrent Celery workers. |
| **Coupon** | Per-sessie unieke code (`BP-XXXXXX`) | `secrets.choice()` voor cryptografische veiligheid, geen raadbare patronen. |
| **Recovery** | `secrets.token_urlsafe(32)` token | 256-bit entropy, URL-safe, 7 dagen geldig. |

---

## 3. Aangemaakte en aangepaste bestanden

### Nieuwe bestanden (backend)

| Bestand | Doel |
|---------|------|
| `backend/app/models/abandoned_checkout.py` | DB-modellen: `AbandonedCheckout` + `Coupon` met enums `CheckoutStatus`, `CouponStatus` |
| `backend/app/services/email_service.py` | SMTP service: `send_email_sync()` + async wrapper `send_email()` |
| `backend/app/services/email_templates/__init__.py` | Package init |
| `backend/app/services/email_templates/abandoned_checkout.py` | HTML + plain text email templates |
| `backend/app/services/abandoned_checkout_service.py` | Business logic: create/update/complete sessie, coupon lifecycle, recovery, scheduled processing |
| `backend/app/api/routes/checkout_sessions.py` | REST endpoints: POST/PATCH/GET voor sessie- en couponbeheer |
| `backend/app/tasks/email_tasks.py` | Celery task: `task_process_abandoned_checkouts` |
| `backend/alembic/versions/b3c4d5e6f7g8_add_abandoned_checkout_tables.py` | Alembic migration voor `abandoned_checkouts` + `coupons` tabellen |
| `docs/abandoned-checkout-flow.md` | Deze documentatie |

### Aangepaste bestanden

| Bestand | Wijziging |
|---------|-----------|
| `backend/app/models/__init__.py` | Import + export van `AbandonedCheckout` en `Coupon` |
| `backend/app/core/config.py` | SMTP + abandoned checkout instellingen toegevoegd |
| `backend/app/tasks/celery_app.py` | Email tasks module + Beat schedule entry |
| `backend/app/api/routes/__init__.py` | `checkout_sessions_router` geregistreerd |
| `frontend/src/app/checkout/checkout-content.tsx` | Fire-and-forget tracking, recovery prefill, coupon display |
| `.env.example` | SMTP + abandoned checkout environment variabelen |

---

## 4. Hoe abandoned checkout wordt gedetecteerd

```
Frontend (Step 1 completed)
    |
    v
POST /api/checkout-sessions   -->  DB: AbandonedCheckout (status=STARTED)
    |
    v
[Gebruiker verlaat pagina / sluit browser]
    |
    ... 60 minuten later ...
    |
    v
Celery Beat trigger (elke 30 min)
    |
    v
SELECT * FROM abandoned_checkouts
WHERE status = 'started'
  AND abandoned_email_sent_at IS NULL
  AND checkout_started_at < NOW() - INTERVAL '60 minutes'
    |
    v
Email verzonden + abandoned_email_sent_at = NOW()
```

**Key detail:** De sessie wordt aangemaakt zodra de gebruiker Step 1 (email + plan keuze) voltooit. Als de sessie niet als `completed` wordt gemarkeerd binnen de configureerbare delay (standaard 60 min), pikt de scheduler het op.

---

## 5. De volledige flow in stappen

1. **Gebruiker start checkout** - Frontend stuurt `POST /api/checkout-sessions` met email, naam, plan, billing cycle
2. **Frontend ontvangt** `session_id` + `recovery_token` (opgeslagen in `useRef`)
3. **Step tracking** - Bij elke stap: `PATCH /api/checkout-sessions/{id}/step` (fire-and-forget)
4. **Gebruiker breekt af** - Sessie blijft in `STARTED` status
5. **Na 60 minuten** - Celery Beat start `task_process_abandoned_checkouts`
6. **Coupon generatie** - Unieke `BP-XXXXXX` code (5% korting, 7 dagen geldig)
7. **Email verzonden** - HTML + plain text met recovery link + coupon
8. **Sessie bijgewerkt** - `abandoned_email_sent_at` wordt gezet (voorkomt herhaling)
9. **Gebruiker klikt recovery link** - Frontend laadt `/checkout?recovery={token}`
10. **Recovery API call** - `GET /api/checkout-sessions/recover/{token}` retourneert plan + coupon
11. **Checkout prefilled** - Plan, billing, trial keuze + coupon worden automatisch ingevuld
12. **Bij succesvolle checkout** - `POST /api/checkout-sessions/{id}/complete` markeert sessie als `COMPLETED`

---

## 6. Recovery link werking

De recovery link heeft het formaat:
```
https://www.betsplug.com/checkout?recovery={token}
```

Frontend flow:
1. `useSearchParams()` leest `recovery` parameter
2. `GET /api/checkout-sessions/recover/{token}` valideert token + controleert expiry
3. Response bevat: `plan_id`, `billing_cycle`, `with_trial`, `first_name`, `coupon_code`
4. Formulier wordt automatisch ingevuld
5. Als er een `coupon_code` zit in de response, wordt die automatisch gevalideerd en getoond

Token beveiliging:
- 256-bit entropy via `secrets.token_urlsafe(32)`
- Verlopen na 168 uur (7 dagen, configureerbaar)
- Eenmalig gebruik (sessie wordt `COMPLETED` na checkout)

---

## 7. Coupon code logica

| Eigenschap | Waarde |
|------------|--------|
| Formaat | `BP-XXXXXX` (6 tekens, hoofdletters + cijfers, geen ambigue chars) |
| Korting | 5% (configureerbaar via `COUPON_DISCOUNT_PERCENT`) |
| Geldigheid | 7 dagen na aanmaak (configureerbaar via `COUPON_EXPIRY_DAYS`) |
| Max gebruik | 1x (single-use) |
| Generatie | `secrets.choice()` - cryptografisch veilig |
| Validatie | `GET /api/checkout-sessions/coupon/{code}` |
| Inwisselen | `POST /api/checkout-sessions/coupon/{code}/redeem` |

Coupon lifecycle:
```
ACTIVE  --(redeem)--> REDEEMED
ACTIVE  --(expired)--> EXPIRED (checked at validation time)
```

---

## 8. Email template beschrijving

**Subject:** `Don't leave your {plan_name} plan behind - here's 5% off!`

HTML template kenmerken:
- BetsPlug dark theme (#0f172a achtergrond)
- Gepersonaliseerde aanhef (voornaam of "there")
- Coupon code block met gouden accent en dashed border
- Groene CTA button "Complete Your Subscription"
- Geldigheid timer ("Your code expires on ...")
- Professionele footer met unsubscribe-hint
- Alt-text voor alle styling (email client fallback)

Plain text fallback:
- Volledige inhoud zonder HTML
- ASCII formatting voor coupon block
- Directe URL links

---

## 9. Configuratieopties (environment variables)

| Variable | Default | Beschrijving |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp.hostinger.com` | SMTP server hostname |
| `SMTP_PORT` | `465` | SMTP port (SSL) |
| `SMTP_USER` | - | Email account username |
| `SMTP_PASS` | - | Email account password |
| `MAIL_FROM_ADDRESS` | - | Afzender email adres |
| `MAIL_FROM_NAME` | `BetsPlug` | Afzender naam |
| `ABANDONED_CHECKOUT_DELAY_MINUTES` | `60` | Wachttijd voor email |
| `COUPON_DISCOUNT_PERCENT` | `5.0` | Kortingspercentage |
| `COUPON_EXPIRY_DAYS` | `7` | Coupon geldigheidsdagen |
| `RECOVERY_TOKEN_EXPIRY_HOURS` | `168` | Recovery link geldigheidsdagen (uren) |
| `SITE_URL` | `https://www.betsplug.com` | Base URL voor email links |

---

## 10. Idempotentie en foutbestendigheid

| Scenario | Gedrag |
|----------|--------|
| **Dubbele sessie (zelfde email + plan)** | Bestaande `STARTED` sessie wordt bijgewerkt i.p.v. nieuwe aanmaken |
| **Celery task crasht** | Max 2 retries met 5 min delay; sessie blijft in `STARTED` voor volgende run |
| **SMTP failure** | `abandoned_email_sent_at` wordt NIET gezet; volgende Celery run probeert opnieuw |
| **Concurrent workers** | `WHERE abandoned_email_sent_at IS NULL` query + atomische DB update voorkomt dubbele emails |
| **Frontend API faalt** | Fire-and-forget: checkout UX wordt nooit geblokkeerd |
| **Recovery token expired** | 404 response; gebruiker kan handmatig opnieuw beginnen |
| **Coupon al gebruikt** | 400 response bij redeem; `is_valid` property checkt status + expiry + usage |

---

## 11. Privacy en compliance

- **Opgeslagen data:** Alleen email, voornaam, plan keuze, billing cycle. Geen wachtwoorden, geen creditcard data, geen adressen.
- **Rechtsgrond:** Transactionele communicatie - gebruiker heeft zelf de checkout gestart. Geen opt-in nodig.
- **Data retention:** Sessies blijven in DB voor analytics; email-adres kan worden geanonimiseerd via admin panel (toekomstige extensie).
- **Frequentie:** Maximaal 1 email per checkout sessie. Geen follow-up drip campaigns.
- **Unsubscribe:** Email bevat disclaimer tekst. Voor volledige GDPR compliance, overweeg een unsubscribe endpoint toe te voegen (zie extensie suggesties).

---

## 12. API Endpoints overzicht

| Method | Path | Beschrijving | Auth |
|--------|------|-------------|------|
| `POST` | `/api/checkout-sessions` | Sessie aanmaken/bijwerken | Geen |
| `PATCH` | `/api/checkout-sessions/{id}/step` | Step tracking | Geen |
| `POST` | `/api/checkout-sessions/{id}/complete` | Sessie voltooien | Geen |
| `GET` | `/api/checkout-sessions/recover/{token}` | Recovery validatie | Geen |
| `GET` | `/api/checkout-sessions/coupon/{code}` | Coupon valideren | Geen |
| `POST` | `/api/checkout-sessions/coupon/{code}/redeem` | Coupon inwisselen | Geen |

> **Opmerking:** Geen authenticatie nodig - de checkout is voor anonieme bezoekers. Rate limiting wordt aanbevolen voor productie (zie extensie suggesties).

---

## 13. Deployment instructies

### Eerste deployment

1. **Environment variables instellen:**
   ```bash
   # In Railway/Docker/hosting dashboard:
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=465
   SMTP_USER=noreply@betsplug.com
   SMTP_PASS=<your-smtp-password>
   MAIL_FROM_ADDRESS=noreply@betsplug.com
   MAIL_FROM_NAME=BetsPlug
   SITE_URL=https://www.betsplug.com
   ```

2. **Database migratie uitvoeren:**
   ```bash
   alembic upgrade head
   ```

3. **Celery worker starten met emails queue:**
   ```bash
   celery -A app.tasks.celery_app worker -Q emails -l info
   ```

4. **Celery Beat starten (als nog niet actief):**
   ```bash
   celery -A app.tasks.celery_app beat -l info
   ```

### Testen

1. Start een checkout in de frontend, vul step 1 in, sluit browser
2. Wacht 60 minuten (of verlaag `ABANDONED_CHECKOUT_DELAY_MINUTES` tijdelijk naar 2)
3. Controleer of de email is ontvangen
4. Klik de recovery link en verifieer dat checkout is pre-filled

---

## 14. Extensie suggesties (STAP 8)

### A. Welcome email na succesvolle registratie
- **Trigger:** Na `POST /api/auth/register` of Stripe webhook `checkout.session.completed`
- **Inhoud:** Bedankt, plan details, quick start guide, support contact
- **Implementatie:** Nieuwe Celery task + email template; hergebruik `email_service.py`
- **Effort:** ~2 uur

### B. Failed payment reminder
- **Trigger:** Stripe webhook `invoice.payment_failed`
- **Inhoud:** "Je betaling is mislukt, update je betaalgegevens"
- **Implementatie:** Stripe webhook handler + nieuwe email template + Celery task
- **Extra:** Link naar Stripe Customer Portal voor betaalgegevens update
- **Effort:** ~3 uur

### C. Renewal / upcoming charge reminder
- **Trigger:** Celery Beat taak, 3 dagen voor `current_period_end`
- **Inhoud:** "Je abonnement wordt over 3 dagen verlengd voor EUR X"
- **Implementatie:** Nieuwe scheduled task die `subscriptions` tabel scant
- **Effort:** ~2 uur

### D. Cancellation winback email
- **Trigger:** Na `subscription.cancelled` webhook of manual cancel
- **Timing:** 7 dagen na cancellation
- **Inhoud:** "We missen je! Hier is 10% korting om terug te komen"
- **Implementatie:** Nieuwe DB veld `cancelled_at` + Celery task + aparte coupon template
- **Effort:** ~3 uur

### E. Reactivation offer na expiry
- **Trigger:** 30 dagen na subscription expiry
- **Inhoud:** "Je BetsPlug toegang is verlopen - heractiveer nu met 15% korting"
- **Implementatie:** Vergelijkbaar met winback maar met andere timing + hoger kortingspercentage
- **Effort:** ~2 uur

### F. Drip sequence voor abandoned checkouts
- **Huidige flow:** 1 email na 60 min
- **Uitbreiding:** Email 2 na 24 uur (urgentie), Email 3 na 72 uur (social proof / testimonials)
- **Implementatie:** `email_sequence_step` kolom in `abandoned_checkouts` + aparte templates per stap
- **Effort:** ~4 uur

### G. Rate limiting op checkout endpoints
- **Reden:** Voorkom misbruik van coupon generatie
- **Implementatie:** `slowapi` middleware of Redis-based rate limiter
- **Aanbeveling:** Max 5 sessies per IP per uur, max 10 coupon validaties per IP per uur
- **Effort:** ~1 uur

### H. Admin dashboard voor abandoned checkouts
- **Features:** Overzicht van sessies, conversie rate, email open rate (via pixel tracking), handmatig resend
- **Implementatie:** Nieuwe admin route + frontend admin pagina
- **Effort:** ~6 uur

---

*Gegenereerd op 2026-04-10. Raadpleeg de bronbestanden voor de meest actuele code.*
