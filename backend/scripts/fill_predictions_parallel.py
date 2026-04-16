"""
Parallel prediction backfill.
Runs 3 batch-predictions calls concurrently for 3x speedup.
"""
import asyncio
import time
import httpx

API_URL = "https://betsplug-production.up.railway.app/api/admin/batch-predictions"
BATCH_SIZE = 100
PARALLELISM = 3  # 3 concurrent requests
PAUSE_BETWEEN_CYCLES = 1.0  # 1 sec between cycle groups


async def call_batch(client, session_num):
    """Call batch-predictions once."""
    for attempt in range(2):
        try:
            resp = await client.post(
                API_URL,
                json={"batch_size": BATCH_SIZE},
                timeout=120,
            )
            if resp.status_code == 200:
                return resp.json()
            else:
                await asyncio.sleep(5)
        except Exception as e:
            await asyncio.sleep(5)
    return {"generated": 0, "evaluated": 0, "remaining": -1, "error": "failed"}


async def main():
    print("=" * 60)
    print(f"  PARALLEL Prediction Backfill")
    print(f"  Parallelism: {PARALLELISM} concurrent requests")
    print(f"  Batch size: {BATCH_SIZE} per request")
    print("=" * 60)

    start_time = time.time()
    total_generated = 0
    cycle_num = 0

    async with httpx.AsyncClient(timeout=120) as client:
        while True:
            cycle_num += 1
            # Run PARALLELISM batches concurrently
            tasks = [call_batch(client, i) for i in range(PARALLELISM)]
            results = await asyncio.gather(*tasks)

            cycle_gen = sum(r.get("generated", 0) for r in results)
            remaining = min(r.get("remaining", 0) for r in results)
            total_generated += cycle_gen

            elapsed = time.time() - start_time
            rate = total_generated / max(elapsed, 1)
            eta_min = (remaining / max(rate, 1)) / 60 if rate > 0 else 0

            print(
                f"  Cycle {cycle_num:>3}: {PARALLELISM} parallel, "
                f"gen={cycle_gen:>3} remaining={remaining:>5} "
                f"| rate={rate:.1f}/s | ETA={eta_min:.0f}min"
            )

            if cycle_gen == 0 or remaining == 0:
                print("  All done!")
                break

            await asyncio.sleep(PAUSE_BETWEEN_CYCLES)

    elapsed_min = (time.time() - start_time) / 60
    print(f"\n{'=' * 60}")
    print(f"  DONE in {elapsed_min:.1f} min")
    print(f"  Total generated: {total_generated}")
    print(f"  Cycles: {cycle_num}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(main())
