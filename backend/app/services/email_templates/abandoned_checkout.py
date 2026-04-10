"""Abandoned checkout email templates (HTML + plain text).

Multi-language support based on the locale stored in the checkout
session.  Falls back to English when the locale is unknown.

Template variables
------------------
- first_name:     User's first name (or fallback greeting)
- plan_name:      Plan display name (e.g. "Gold")
- coupon_code:    Unique discount code (e.g. "BP-K7M4XR")
- discount_pct:   Discount percentage (e.g. "5")
- expiry_date:    Human-readable expiry (e.g. "17 april 2026")
- recovery_url:   Full URL to resume checkout
- site_url:       Homepage URL
- support_email:  Support contact email
- locale:         Two-letter locale code (en, nl, de, fr, es, it, sw, id)
"""

from __future__ import annotations


# --------------------------------------------------------------------------- #
# Translations
# --------------------------------------------------------------------------- #

_COPY = {
    "en": {
        "subject": "You're leaving profit on the table, {first_name}",
        "title": "You're leaving profit on the table, {first_name}",
        "intro": "You were one step away from smarter predictions with the <strong style=\"color:#4ade80;\">{plan_name}</strong> plan. We're keeping your spot warm.",
        "coupon_label": "Your exclusive code",
        "discount_line": "<strong style=\"color:#4ade80;\">{discount_pct}% off</strong> your first payment",
        "expiry_line": "Expires in 24 hours (valid until {expiry_date})",
        "cta": "Claim your discount",
        "cta_sub": "Click above and your checkout will resume automatically.",
        "usp1_title": "AI-Powered",
        "usp1_sub": "Predictions",
        "usp2_title": "Proven",
        "usp2_sub": "Track Record",
        "usp3_title": "Cancel",
        "usp3_sub": "Anytime",
        "footer_q": "Questions? Email us at",
        "footer_note": "You're receiving this email because you started a checkout on <a href=\"{site_url}\" style=\"color:#475569;text-decoration:underline;\">BetsPlug</a>. This is a one-time reminder.",
        "fallback_name": "there",
    },
    "nl": {
        "subject": "Je laat winst liggen, {first_name}",
        "title": "Je laat winst liggen, {first_name}",
        "intro": "Je was een stap verwijderd van slimmere voorspellingen met het <strong style=\"color:#4ade80;\">{plan_name}</strong>-abonnement. We houden je plek nog even warm.",
        "coupon_label": "Jouw exclusieve code",
        "discount_line": "<strong style=\"color:#4ade80;\">{discount_pct}% korting</strong> op je eerste betaling",
        "expiry_line": "Verloopt over 24 uur (geldig t/m {expiry_date})",
        "cta": "Claim je korting",
        "cta_sub": "Klik hierboven en je checkout wordt automatisch hervat.",
        "usp1_title": "AI-Powered",
        "usp1_sub": "Voorspellingen",
        "usp2_title": "Bewezen",
        "usp2_sub": "Track Record",
        "usp3_title": "Cancel",
        "usp3_sub": "Wanneer je wilt",
        "footer_q": "Vragen? Mail ons op",
        "footer_note": "Je ontvangt deze mail omdat je een checkout hebt gestart op <a href=\"{site_url}\" style=\"color:#475569;text-decoration:underline;\">BetsPlug</a>. Dit is een eenmalige herinnering.",
        "fallback_name": "daar",
    },
    "de": {
        "subject": "Du lässt Gewinne liegen, {first_name}",
        "title": "Du lässt Gewinne liegen, {first_name}",
        "intro": "Du warst nur einen Schritt von smarteren Vorhersagen mit dem <strong style=\"color:#4ade80;\">{plan_name}</strong>-Abo entfernt. Wir halten deinen Platz frei.",
        "coupon_label": "Dein exklusiver Code",
        "discount_line": "<strong style=\"color:#4ade80;\">{discount_pct}% Rabatt</strong> auf deine erste Zahlung",
        "expiry_line": "Läuft in 24 Stunden ab (gültig bis {expiry_date})",
        "cta": "Rabatt sichern",
        "cta_sub": "Klicke oben und dein Checkout wird automatisch fortgesetzt.",
        "usp1_title": "KI-gestützt",
        "usp1_sub": "Vorhersagen",
        "usp2_title": "Bewährte",
        "usp2_sub": "Erfolgsbilanz",
        "usp3_title": "Jederzeit",
        "usp3_sub": "Kündbar",
        "footer_q": "Fragen? Schreib uns an",
        "footer_note": "Du erhältst diese E-Mail, weil du einen Checkout auf <a href=\"{site_url}\" style=\"color:#475569;text-decoration:underline;\">BetsPlug</a> gestartet hast. Dies ist eine einmalige Erinnerung.",
        "fallback_name": "dort",
    },
    "fr": {
        "subject": "Tu laisses des gains sur la table, {first_name}",
        "title": "Tu laisses des gains sur la table, {first_name}",
        "intro": "Tu étais à un pas de prédictions plus intelligentes avec l'abonnement <strong style=\"color:#4ade80;\">{plan_name}</strong>. On garde ta place au chaud.",
        "coupon_label": "Ton code exclusif",
        "discount_line": "<strong style=\"color:#4ade80;\">{discount_pct}% de réduction</strong> sur ton premier paiement",
        "expiry_line": "Expire dans 24 heures (valable jusqu'au {expiry_date})",
        "cta": "Réclame ta réduction",
        "cta_sub": "Clique ci-dessus et ton checkout reprendra automatiquement.",
        "usp1_title": "Intelligence",
        "usp1_sub": "Artificielle",
        "usp2_title": "Historique",
        "usp2_sub": "Prouvé",
        "usp3_title": "Annulation",
        "usp3_sub": "À tout moment",
        "footer_q": "Questions ? Écris-nous à",
        "footer_note": "Tu reçois cet e-mail car tu as commencé un checkout sur <a href=\"{site_url}\" style=\"color:#475569;text-decoration:underline;\">BetsPlug</a>. Ceci est un rappel unique.",
        "fallback_name": "là",
    },
    "es": {
        "subject": "Estás dejando ganancias en la mesa, {first_name}",
        "title": "Estás dejando ganancias en la mesa, {first_name}",
        "intro": "Estabas a un paso de predicciones más inteligentes con el plan <strong style=\"color:#4ade80;\">{plan_name}</strong>. Te guardamos tu lugar.",
        "coupon_label": "Tu código exclusivo",
        "discount_line": "<strong style=\"color:#4ade80;\">{discount_pct}% de descuento</strong> en tu primer pago",
        "expiry_line": "Expira en 24 horas (válido hasta {expiry_date})",
        "cta": "Reclama tu descuento",
        "cta_sub": "Haz clic arriba y tu checkout se reanudará automáticamente.",
        "usp1_title": "Inteligencia",
        "usp1_sub": "Artificial",
        "usp2_title": "Historial",
        "usp2_sub": "Comprobado",
        "usp3_title": "Cancela",
        "usp3_sub": "Cuando quieras",
        "footer_q": "¿Preguntas? Escríbenos a",
        "footer_note": "Recibes este correo porque iniciaste un checkout en <a href=\"{site_url}\" style=\"color:#475569;text-decoration:underline;\">BetsPlug</a>. Este es un recordatorio único.",
        "fallback_name": "ahí",
    },
    "it": {
        "subject": "Stai lasciando profitti sul tavolo, {first_name}",
        "title": "Stai lasciando profitti sul tavolo, {first_name}",
        "intro": "Eri a un passo da previsioni più intelligenti con l'abbonamento <strong style=\"color:#4ade80;\">{plan_name}</strong>. Ti teniamo il posto al caldo.",
        "coupon_label": "Il tuo codice esclusivo",
        "discount_line": "<strong style=\"color:#4ade80;\">{discount_pct}% di sconto</strong> sul tuo primo pagamento",
        "expiry_line": "Scade tra 24 ore (valido fino al {expiry_date})",
        "cta": "Richiedi lo sconto",
        "cta_sub": "Clicca qui sopra e il tuo checkout riprenderà automaticamente.",
        "usp1_title": "Intelligenza",
        "usp1_sub": "Artificiale",
        "usp2_title": "Risultati",
        "usp2_sub": "Comprovati",
        "usp3_title": "Cancella",
        "usp3_sub": "Quando vuoi",
        "footer_q": "Domande? Scrivici a",
        "footer_note": "Ricevi questa email perché hai iniziato un checkout su <a href=\"{site_url}\" style=\"color:#475569;text-decoration:underline;\">BetsPlug</a>. Questo è un promemoria unico.",
        "fallback_name": "lì",
    },
    "sw": {
        "subject": "Unaacha faida mezani, {first_name}",
        "title": "Unaacha faida mezani, {first_name}",
        "intro": "Ulikuwa hatua moja kutoka kwa utabiri bora na mpango wa <strong style=\"color:#4ade80;\">{plan_name}</strong>. Tunakuhifadhia nafasi yako.",
        "coupon_label": "Nambari yako ya kipekee",
        "discount_line": "<strong style=\"color:#4ade80;\">Punguzo la {discount_pct}%</strong> kwenye malipo yako ya kwanza",
        "expiry_line": "Inaisha baada ya saa 24 (halali hadi {expiry_date})",
        "cta": "Dai punguzo lako",
        "cta_sub": "Bonyeza hapo juu na checkout yako itaendelea moja kwa moja.",
        "usp1_title": "AI-Powered",
        "usp1_sub": "Utabiri",
        "usp2_title": "Rekodi",
        "usp2_sub": "Iliyothibitishwa",
        "usp3_title": "Ghairi",
        "usp3_sub": "Wakati wowote",
        "footer_q": "Maswali? Tuandikie",
        "footer_note": "Unapokea barua pepe hii kwa sababu ulianza checkout kwenye <a href=\"{site_url}\" style=\"color:#475569;text-decoration:underline;\">BetsPlug</a>. Hiki ni kikumbusho cha mara moja.",
        "fallback_name": "hapo",
    },
    "id": {
        "subject": "Kamu meninggalkan keuntungan, {first_name}",
        "title": "Kamu meninggalkan keuntungan, {first_name}",
        "intro": "Kamu tinggal selangkah lagi dari prediksi yang lebih cerdas dengan paket <strong style=\"color:#4ade80;\">{plan_name}</strong>. Kami menjaga tempatmu tetap hangat.",
        "coupon_label": "Kode eksklusifmu",
        "discount_line": "<strong style=\"color:#4ade80;\">Diskon {discount_pct}%</strong> untuk pembayaran pertamamu",
        "expiry_line": "Kedaluwarsa dalam 24 jam (berlaku sampai {expiry_date})",
        "cta": "Klaim diskonmu",
        "cta_sub": "Klik di atas dan checkout-mu akan dilanjutkan otomatis.",
        "usp1_title": "AI-Powered",
        "usp1_sub": "Prediksi",
        "usp2_title": "Rekam Jejak",
        "usp2_sub": "Terbukti",
        "usp3_title": "Batalkan",
        "usp3_sub": "Kapan saja",
        "footer_q": "Pertanyaan? Email kami di",
        "footer_note": "Kamu menerima email ini karena kamu memulai checkout di <a href=\"{site_url}\" style=\"color:#475569;text-decoration:underline;\">BetsPlug</a>. Ini adalah pengingat satu kali.",
        "fallback_name": "di sana",
    },
}


def _get_copy(locale: str | None) -> dict:
    """Return the copy dict for the given locale, falling back to English."""
    if locale and locale[:2].lower() in _COPY:
        return _COPY[locale[:2].lower()]
    return _COPY["en"]


# --------------------------------------------------------------------------- #
# HTML template
# --------------------------------------------------------------------------- #

def render_html(
    *,
    first_name: str,
    plan_name: str,
    coupon_code: str,
    discount_pct: str,
    expiry_date: str,
    recovery_url: str,
    site_url: str,
    support_email: str,
    locale: str | None = None,
) -> str:
    c = _get_copy(locale)
    if not first_name or first_name.lower() in ("there", "daar"):
        first_name = c["fallback_name"]

    title = c["title"].format(first_name=first_name)
    intro = c["intro"].format(plan_name=plan_name)
    discount_line = c["discount_line"].format(discount_pct=discount_pct)
    expiry_line = c["expiry_line"].format(expiry_date=expiry_date)
    footer_note = c["footer_note"].format(site_url=site_url)
    lang = (locale or "en")[:2].lower()

    return f"""\
<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <!--[if mso]>
  <style>table,td{{font-family:Arial,sans-serif !important;}}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#080b14;font-family:'Lato',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#080b14;">
    <tr>
      <td align="center" style="padding:0;">

        <!-- Top ambient glow -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:radial-gradient(ellipse at top center, rgba(74,222,128,0.08) 0%, transparent 60%);max-width:640px;">
          <tr>
            <td style="padding:48px 24px 0;">

              <!-- Inner card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background-color:#0d1220;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">

                <!-- Green top accent line -->
                <tr>
                  <td style="height:3px;background:linear-gradient(90deg,transparent,#4ade80,transparent);font-size:0;line-height:0;">&nbsp;</td>
                </tr>

                <!-- Logo -->
                <tr>
                  <td align="center" style="padding:36px 32px 20px;">
                    <a href="{site_url}" style="text-decoration:none;">
                      <img src="{site_url}/logo-email.png" alt="BetsPlug" width="140" style="display:block;max-width:140px;height:auto;" />
                    </a>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td style="padding:0 36px;">
                    <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#f8fafc;line-height:1.25;text-align:center;letter-spacing:-0.5px;">
                      {title}
                    </h1>
                    <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.7;text-align:center;">
                      {intro}
                    </p>
                  </td>
                </tr>

                <!-- Spacer -->
                <tr><td style="padding:20px 0 0;"></td></tr>

                <!-- Coupon block -->
                <tr>
                  <td style="padding:0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141b2e;border:1px solid rgba(74,222,128,0.2);border-radius:16px;overflow:hidden;">
                      <tr>
                        <td style="background:radial-gradient(ellipse at center, rgba(74,222,128,0.06) 0%, transparent 70%);padding:24px 28px;text-align:center;">
                          <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#4ade80;">
                            {c["coupon_label"]}
                          </p>

                          <!-- Code box with dashed border -->
                          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px auto 12px;">
                            <tr>
                              <td style="padding:12px 32px;border:2px dashed rgba(74,222,128,0.4);border-radius:12px;background-color:rgba(74,222,128,0.06);">
                                <span style="font-size:30px;font-weight:900;color:#4ade80;letter-spacing:3px;font-family:'Courier New',monospace;">{coupon_code}</span>
                              </td>
                            </tr>
                          </table>

                          <p style="margin:0 0 4px;font-size:15px;color:#e2e8f0;">
                            {discount_line}
                          </p>
                          <p style="margin:8px 0 0;font-size:12px;color:#ef4444;font-weight:700;">
                            {expiry_line}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding:28px 36px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background:linear-gradient(135deg,#4ade80,#22c55e);border-radius:14px;box-shadow:0 6px 24px rgba(74,222,128,0.28);">
                          <a href="{recovery_url}" style="display:inline-block;color:#0a0e1a;font-size:16px;font-weight:800;text-decoration:none;padding:16px 48px;letter-spacing:-0.2px;text-transform:uppercase;">
                            {c["cta"]}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Urgency subtext -->
                <tr>
                  <td style="padding:14px 36px 0;">
                    <p style="margin:0;font-size:12px;color:#64748b;text-align:center;line-height:1.5;">
                      {c["cta_sub"]}
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:28px 36px;">
                    <div style="border-top:1px solid rgba(255,255,255,0.06);"></div>
                  </td>
                </tr>

                <!-- USP blocks -->
                <tr>
                  <td style="padding:0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="33%" style="padding:0 6px;text-align:center;vertical-align:top;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                            <tr>
                              <td style="padding:16px 8px;">
                                <p style="margin:0 0 4px;font-size:20px;line-height:1;">&#9889;</p>
                                <p style="margin:0;font-size:11px;font-weight:700;color:#e2e8f0;line-height:1.3;">{c["usp1_title"]}</p>
                                <p style="margin:2px 0 0;font-size:10px;color:#64748b;line-height:1.3;">{c["usp1_sub"]}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="33%" style="padding:0 6px;text-align:center;vertical-align:top;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                            <tr>
                              <td style="padding:16px 8px;">
                                <p style="margin:0 0 4px;font-size:20px;line-height:1;">&#128200;</p>
                                <p style="margin:0;font-size:11px;font-weight:700;color:#e2e8f0;line-height:1.3;">{c["usp2_title"]}</p>
                                <p style="margin:2px 0 0;font-size:10px;color:#64748b;line-height:1.3;">{c["usp2_sub"]}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="33%" style="padding:0 6px;text-align:center;vertical-align:top;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                            <tr>
                              <td style="padding:16px 8px;">
                                <p style="margin:0 0 4px;font-size:20px;line-height:1;">&#128274;</p>
                                <p style="margin:0;font-size:11px;font-weight:700;color:#e2e8f0;line-height:1.3;">{c["usp3_title"]}</p>
                                <p style="margin:2px 0 0;font-size:10px;color:#64748b;line-height:1.3;">{c["usp3_sub"]}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:24px 36px;">
                    <div style="border-top:1px solid rgba(255,255,255,0.06);"></div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:0 36px 32px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-align:center;line-height:1.6;">
                      {c["footer_q"]}
                      <a href="mailto:{support_email}" style="color:#4ade80;text-decoration:none;font-weight:700;">{support_email}</a>
                    </p>
                    <p style="margin:0;font-size:10px;color:#475569;text-align:center;line-height:1.6;">
                      {footer_note}
                    </p>
                  </td>
                </tr>

              </table>
              <!-- /Inner card -->

              <!-- Bottom spacing -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 0 48px;text-align:center;">
                    <a href="{site_url}" style="font-size:11px;color:#334155;text-decoration:none;">
                      &copy; 2026 BetsPlug. All rights reserved.
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>"""


# --------------------------------------------------------------------------- #
# Plain text template
# --------------------------------------------------------------------------- #

def render_text(
    *,
    first_name: str,
    plan_name: str,
    coupon_code: str,
    discount_pct: str,
    expiry_date: str,
    recovery_url: str,
    site_url: str,
    support_email: str,
    locale: str | None = None,
) -> str:
    c = _get_copy(locale)
    if not first_name or first_name.lower() in ("there", "daar"):
        first_name = c["fallback_name"]

    title = c["title"].format(first_name=first_name)
    # Strip HTML from discount line for plain text
    discount_plain = c["discount_line"].format(discount_pct=discount_pct)
    discount_plain = discount_plain.replace('<strong style="color:#4ade80;">', '').replace('</strong>', '')
    expiry_plain = c["expiry_line"].format(expiry_date=expiry_date)

    return f"""\
{title}

{c["intro"].replace('<strong style="color:#4ade80;">', '').replace('</strong>', '').format(plan_name=plan_name)}

    {coupon_code} - {discount_plain}

    {expiry_plain}

{recovery_url}

- {c["usp1_title"]} {c["usp1_sub"]}
- {c["usp2_title"]} {c["usp2_sub"]}
- {c["usp3_title"]} {c["usp3_sub"]}

---

{c["footer_q"]} {support_email}

BetsPlug - {site_url}
"""
