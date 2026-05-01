═══════════════════════════════════════════════════════
PAGE TYPE: CONTACT
URL: /contact (alle locales — universele slug)
═══════════════════════════════════════════════════════

PAGE PURPOSE

Primary: support requests faciliteren
Secondary: pre-sales vragen capturen
Tertiary: trust signal — bereikbaarheid demonstreren

═══════════════════════════════════════════════════════
SECTIE 1: HERO (Compact)
═══════════════════════════════════════════════════════

LAYOUT: licht, ~25vh, centered

H1:
EN: "Get in Touch"
NL: "Neem Contact Op"
DE: "Kontakt Aufnehmen"
FR: "Nous Contacter"
ES: "Ponte en Contacto"
IT: "Contattaci"

Subheadline:
EN: "Questions about predictions, subscriptions, or methodology? 
     We typically respond within 24 hours."

═══════════════════════════════════════════════════════
SECTIE 2: CONTACT OPTIONS (Multi-channel)
═══════════════════════════════════════════════════════

LAYOUT: 2-column desktop, form rechts, contact info links

CONTACT INFO PANEL (links, 40% desktop)

EMAIL
Header: "Email"
Address: support@betsplug.com (placeholder — vul werkelijke email in)
Response time: "Within 24 hours"

TELEGRAM (als beschikbaar)
Header: "Telegram"
Channel: "@betsplug_support" (placeholder)
Use case: "Quick questions, account help"

BUSINESS HOURS
Header: "Hours"
Body: "Monday–Friday, 9:00–18:00 CET"
Note: "Email available 24/7, response within business hours"

LOCATION (optional, alleen als publiek bekend wilt)
Header: "Office"
Address: "[Your business address]" or skip if niet publiek

CONTACT FORM (rechts, 60% desktop)

H2:
EN: "Send a Message"
(vertaal per locale)

Form fields:

1. Name (required)
   - Type: text
   - Placeholder: "Your name"
   - Validation: minimum 2 characters

2. Email (required)
   - Type: email
   - Placeholder: "you@email.com"
   - Validation: valid email format

3. Subject (required, dropdown)
   Options:
   - General question
   - Subscription / billing
   - Technical issue
   - Methodology question
   - Press / partnership
   - Other

4. Message (required)
   - Type: textarea, 6 rows
   - Placeholder: "Tell us how we can help..."
   - Validation: minimum 20 characters
   - Counter: characters used (max 2000)

5. Plan (optional, alleen tonen als logged in)
   - Auto-filled if known
   - Helps support route

6. CAPTCHA (anti-spam)
   - Cloudflare Turnstile of hCaptcha (privacy-friendly)
   - Geen Google reCAPTCHA (privacy concerns)

7. GDPR consent checkbox (required for EU)
   - "I agree to BetsPlug processing my message according to 
     the Privacy Policy"
   - Link naar /privacy

CTA: "Send Message"
- Disabled until alle required fields valid
- Loading state tijdens submission
- Success: green message + form reset
- Error: red message + retry option

FORM SUBMISSION

POST naar /api/contact endpoint
- Body: { name, email, subject, message, plan, locale }
- Backend: opslaan + email naar support team
- User: confirmation email met ticket ID

═══════════════════════════════════════════════════════
SECTIE 3: BEFORE YOU EMAIL (Self-service)
═══════════════════════════════════════════════════════

LAYOUT: lichte sectie, max-width container-md

H2:
EN: "Maybe We Already Answered Your Question"
NL: "Misschien Hebben We Je Vraag Al Beantwoord"
(vertaal per locale)

Body:
EN: "Before sending a message, check if your question is covered:"

LINKS GRID (2x3):

1. "How predictions work" → /methodology
2. "Pricing & plans" → /pricing
3. "Track record explained" → /track-record
4. "FAQ" → /faq
5. "Free vs Paid" → /free-vs-paid
6. "Account help" → app.betsplug.com/help

═══════════════════════════════════════════════════════
SECTIE 4: COMMON CONTACT REASONS (FAQ-Lite)
═══════════════════════════════════════════════════════

H2:
EN: "Common Questions"
(vertaal per locale)

5 quick FAQs (accordion):

Q1: "How do I cancel my subscription?"
A: "From your account dashboard at app.betsplug.com/account, click 
   'Subscription' and 'Cancel Plan'. One click. No phone calls."

Q2: "I'm not receiving prediction emails. What now?"
A: "Check spam/junk folder first. If not there, verify your email 
   in account settings. Still nothing? Email us with your account 
   email and we'll investigate within 24 hours."

Q3: "Can you predict a specific match for me?"
A: "We publish predictions for all matches in our covered leagues. 
   Subscribers can browse all predictions; free users see top 3 
   leagues only. We don't generate custom predictions for specific 
   matches on request."

Q4: "I want a refund."
A: "If you're within 7 days of your first paid charge, request 
   a refund via this contact form (subject: Subscription/billing). 
   Refunds processed within 3 business days. After 7 days, we 
   don't offer pro-rated refunds."

Q5: "How do I update my account email?"
A: "From account dashboard at app.betsplug.com/account, click 
   'Profile' and update email. You'll receive a verification 
   email at the new address before the change takes effect."

═══════════════════════════════════════════════════════
TECHNISCHE VEREISTEN
═══════════════════════════════════════════════════════

PERFORMANCE
- Lighthouse ≥95
- Form: client-side validation eerst, server-side validatie na submit
- No-JS fallback: form submits to /api/contact endpoint normaal

SEO META

Title:
EN: "Contact BetsPlug — Support & Inquiries | BetsPlug"
(vertaal per locale)

Meta description:
EN: "Contact BetsPlug support for questions about predictions, 
     subscriptions, or methodology. Email response within 24 hours."

SCHEMA.ORG

1. ContactPage schema
2. Organization with contactPoint
3. BreadcrumbList

ACCESSIBILITY
- Form: alle inputs hebben labels
- Errors aria-live="polite" voor screen readers
- Required fields aria-required="true"
- CAPTCHA accessible alternative
- Submit button focused state visible
- Form errors duidelijk gekoppeld aan input via aria-describedby

CONTENT TODOS VOOR JOU
- Werkelijke support email invullen
- Werkelijke business hours invullen
- Werkelijke Telegram channel of weglaten
- Office address publiceren of weglaten
- CAPTCHA service kiezen (Turnstile aanbevolen)
- Email backend setup (waar gaat /api/contact heen?)
