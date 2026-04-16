"""
Fill predictions safely via Railway batch-predictions endpoint.

Strategy:
- Small batches (500 at a time)
- 2 sec pause between calls (let Postgres breathe)
- Stop on 0 remaining OR on error
- Progress logging per call
- Automatic retry on 502/timeout
"""
import time
import httpx

API_URL = "https://betsplug-production.up.railway.app/api/admin/batch-predictions"
BATCH_SIZE = 100
PAUSE_BETWEEN_BATCHES = 1.5  # seconds
MAX_RETRIES = 3

def main():
    print("=" * 60)
    print("  SAFE Prediction Backfill")
    print(f"  Batch size: {BATCH_SIZE}")
    print(f"  Pause between batches: {PAUSE_BETWEEN_BATCHES}s")
    print("=" * 60)

    client = httpx.Client(timeout=120)
    total_generated = 0
    total_evaluated = 0
    batch_num = 0
    start_time = time.time()

    while True:
        batch_num += 1
        # Retry on transient errors
        for attempt in range(MAX_RETRIES):
            try:
                resp = client.post(
                    API_URL,
                    json={"batch_size": BATCH_SIZE},
                    timeout=120,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    break
                else:
                    print(f"  Batch {batch_num} attempt {attempt+1}: HTTP {resp.status_code}")
                    time.sleep(10)
            except Exception as e:
                print(f"  Batch {batch_num} attempt {attempt+1}: {type(e).__name__}")
                time.sleep(10)
        else:
            print(f"  FAILED after {MAX_RETRIES} attempts — stopping")
            break

        generated = data.get("generated", 0)
        evaluated = data.get("evaluated", 0)
        remaining = data.get("remaining", 0)

        total_generated += generated
        total_evaluated += evaluated

        elapsed = time.time() - start_time
        rate = total_generated / max(elapsed, 1)
        eta_sec = remaining / max(rate, 1) if rate > 0 else 0
        eta_min = eta_sec / 60

        print(
            f"  Batch {batch_num:>3}: gen={generated:>4} eval={evaluated:>4} "
            f"remaining={remaining:>5} | rate={rate:.0f}/s | ETA={eta_min:.0f}min"
        )

        if generated == 0 or remaining == 0:
            print("  All done!")
            break

        time.sleep(PAUSE_BETWEEN_BATCHES)

    elapsed_min = (time.time() - start_time) / 60
    print(f"\n{'=' * 60}")
    print(f"  DONE in {elapsed_min:.1f} min")
    print(f"  Total generated: {total_generated}")
    print(f"  Total evaluated: {total_evaluated}")
    print(f"  Batches: {batch_num}")
    print(f"{'=' * 60}")

    client.close()


if __name__ == "__main__":
    main()
