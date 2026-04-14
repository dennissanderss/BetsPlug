"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useTranslations } from "@/i18n/locale-provider";

interface Notification {
  name: string;
  plan: string;
  minutesAgo: number;
}

const names = [
  // American
  "Michael",
  "Jessica",
  "David",
  "Ashley",
  "Tyler",
  "Brittany",
  "Brandon",
  "Megan",
  "Justin",
  "Hailey",
  "Dustin",
  "Kaitlyn",
  "Cody",
  // European
  "Lucas",
  "Sophie",
  "Mark",
  "Emma",
  "Thomas",
  "Isabella",
  "Mateusz",
  "Elena",
  "Niklas",
  "Chloé",
  "Luca",
  "Freya",
  "Bjorn",
  "Matilda",
  // Indonesian
  "Budi",
  "Siti",
  "Agus",
  "Dewi",
  "Rizky",
  "Putri",
  "Bayu",
  "Ayu",
  "Joko",
  "Wulan",
  "Andi",
  "Rani",
  "Eka",
  // African
  "Kwame",
  "Amara",
  "Chidi",
  "Zanele",
  "Tunde",
  "Nia",
  "Sipho",
  "Amina",
  "Kofi",
  "Thandiwe",
  "Oluwaseun",
  "Adaeze",
  "Mandla",
  "Fatima",
];

// Keep in sync with the PLANS array in checkout-content.tsx — these
// must match the real tier names shown on the checkout page, otherwise
// the social proof loses credibility the moment a visitor clicks through.
const plans = ["Bronze", "Silver", "Gold", "Platinum"] as const;

const MAX_POPUPS_PER_SESSION = 2;
const SESSION_KEY = "betsplug_social_proof_count";

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNotification(): Notification {
  return {
    name: pickRandom(names),
    plan: pickRandom(plans),
    minutesAgo: Math.floor(Math.random() * 28) + 2, // 2-29 min
  };
}

export function SocialProofPopup() {
  const { t } = useTranslations();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    let shownCount = 0;

    // Read existing session count
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) shownCount = parseInt(stored, 10) || 0;
    } catch {
      // ignore
    }

    const scheduleNext = (isFirst: boolean) => {
      if (shownCount >= MAX_POPUPS_PER_SESSION) return;

      // First popup: 8-15s, subsequent: 35-70s gap
      const delay = isFirst
        ? 8000 + Math.random() * 7000
        : 35000 + Math.random() * 35000;

      const showTimer = setTimeout(() => {
        setNotification(generateNotification());
        setVisible(true);
        shownCount += 1;
        try {
          sessionStorage.setItem(SESSION_KEY, String(shownCount));
        } catch {
          // ignore
        }

        // Auto-hide after 7s
        const hideTimer = setTimeout(() => {
          setVisible(false);
          // Schedule next one after it's hidden
          const nextTimer = setTimeout(() => scheduleNext(false), 600);
          timers.push(nextTimer);
        }, 7000);
        timers.push(hideTimer);
      }, delay);
      timers.push(showTimer);
    };

    scheduleNext(true);

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const handleClose = () => setVisible(false);

  if (!notification) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-[70] transition-all duration-500 sm:bottom-6 sm:left-6 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-3 pr-9 shadow-xl shadow-slate-200/50 backdrop-blur-xl sm:p-4 sm:pr-10">
        {/* Icon */}
        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 shadow-sm sm:h-11 sm:w-11">
          <CheckCircle2 className="h-5 w-5 text-green-500 sm:h-6 sm:w-6" />
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
        </div>

        {/* Text */}
        <div className="relative flex min-w-0 flex-col">
          <p className="max-w-[240px] truncate text-xs leading-tight text-slate-600 sm:max-w-[280px] sm:text-sm">
            <span className="font-semibold text-slate-900">{notification.name}</span>{" "}
            {t("socialProof.subscribed")}{" "}
            <span className="font-semibold text-green-600">
              {notification.plan}
            </span>{" "}
            {t("socialProof.plan")}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 sm:text-[11px]">
            {notification.minutesAgo} {t("socialProof.minAgo")} · {t("socialProof.verified")}
          </p>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          aria-label={t("socialProof.dismiss")}
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={12} />
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden rounded-b-2xl bg-slate-100">
          <div
            className={`h-full bg-gradient-to-r from-green-400 to-emerald-500 ${
              visible ? "animate-[shrink_7s_linear_forwards]" : ""
            }`}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
