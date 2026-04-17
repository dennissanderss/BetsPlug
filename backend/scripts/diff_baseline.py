"""
Compare live endpoints against docs/_baseline_snapshot.json.
Any mismatch is flagged for review.
"""
import json
import os
import ssl
import sys
import urllib.request
from datetime import datetime, timezone

BASELINE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "docs", "_baseline_snapshot.json",
)
BASE = "https://betsplug-production.up.railway.app/api"

# Fields that may drift legitimately (evaluator progresses, new preds added)
DRIFT_OK = {"total_forecasts", "evaluated_count", "total_predictions",
            "correct_predictions"}
# Fields that should stay stable within 1pp
ACCURACY_OK_TOL = 0.01


def fetch(ep: str) -> dict:
    entry: dict = {}
    try:
        req = urllib.request.Request(BASE + ep, headers={"User-Agent": "diff-check"})
        with urllib.request.urlopen(req, context=ssl.create_default_context(), timeout=15) as r:
            entry["status"] = r.status
            body = r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        entry["status"] = e.code
        body = e.read().decode("utf-8")
    except Exception as e:
        entry["status"] = "ERR"
        body = str(e)
    try:
        data = json.loads(body)
        if isinstance(data, dict):
            for k in ("accuracy", "total_forecasts", "evaluated_count",
                      "total_predictions", "correct_predictions"):
                if k in data:
                    entry[k] = data[k]
            if data.get("per_tier"):
                entry["per_tier"] = {t: d.get("accuracy") for t, d in data["per_tier"].items()}
        elif isinstance(data, list):
            entry["list_len"] = len(data)
            entry["items_summary"] = [
                {k: x[k] for k in ("pick_tier", "accuracy_pct", "sample_size", "picks_per_day_estimate") if k in x}
                for x in data if isinstance(x, dict)
            ]
    except Exception:
        pass
    return entry


def main() -> int:
    with open(BASELINE) as f:
        base = json.load(f)

    print(f"Baseline from: {base['timestamp']}")
    print(f"Now:           {datetime.now(timezone.utc).isoformat(timespec='seconds')}")
    print()

    issues: list[str] = []
    for ep, b in base["endpoints"].items():
        cur = fetch(ep)
        status_ok = cur.get("status") == b.get("status")
        marker = "OK  " if status_ok else "FAIL"
        print(f"{marker}  {ep}: {b.get('status')} -> {cur.get('status')}")
        if not status_ok:
            issues.append(f"{ep}: status {b.get('status')} -> {cur.get('status')}")
        # Accuracy drift
        if "accuracy" in b and "accuracy" in cur:
            delta = abs(float(b["accuracy"]) - float(cur["accuracy"]))
            if delta > ACCURACY_OK_TOL:
                issues.append(f"{ep}: accuracy drift {b['accuracy']:.4f} -> {cur['accuracy']:.4f} (Δ={delta:.4f})")
        # Per-tier drift
        if b.get("per_tier") and cur.get("per_tier"):
            for tier, base_acc in b["per_tier"].items():
                cur_acc = cur["per_tier"].get(tier)
                if cur_acc is None:
                    issues.append(f"{ep}: tier '{tier}' missing now")
                elif abs(float(base_acc) - float(cur_acc)) > ACCURACY_OK_TOL:
                    issues.append(f"{ep}: per_tier.{tier} {base_acc:.3f} -> {cur_acc:.3f}")
        # Pricing sample sizes
        if "items_summary" in b and "items_summary" in cur:
            if len(b["items_summary"]) != len(cur["items_summary"]):
                issues.append(f"{ep}: pricing tier count {len(b['items_summary'])} -> {len(cur['items_summary'])}")

    print()
    if issues:
        print(f"ISSUES ({len(issues)}):")
        for i in issues:
            print(f"  - {i}")
        return 1
    print("No drift detected. System stable.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
