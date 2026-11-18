# Session 21 — Clock readings, deadlines and live windows

**Date:** 18 November 2026, Europe/Zurich. **Status:** local, implementation PR and main CI passed; independent read-only verification and final acceptance pending. Exactly five exports are selected: `timeInterval`, `timeout`, `timeoutWith`, `timestamp`, and `window`.

The user explicitly instructed: **“lets do Session 21 today 18.11.2026”**, after Session 20 was closed that day. This is a specific exception to the ordinary daily-session limit. It does not relax the five-export limit or any verification gate. The [numbered reservation](../planning/sessions/2026-11-18-session-21.json) preserves the [closed Session 20 record](../planning/sessions/2026-11-18.json). The accepted starting inventory is **100/113**, with **13 pending** and no carryovers.

The reservation was committed without force at [`9889e30d2fef018e4ebf54d989170039466f6d98`](https://github.com/hansschenker/rxjs-formal-way/commit/9889e30d2fef018e4ebf54d989170039466f6d98), on the previously accepted main commit `4de938c4df06148c4d3fc037ea9d5b89987a426f`.

## Scope and canonical artifacts

The [session guide](../docs/SESSION-21-TIME-AND-WINDOWS.md) follows Intuition → Specification → Verification. Detailed guides define all five explicit six-tuples, Cω shapes, state-dependent guards, time, cancellation, sharing and limits. The [scenario map](../docs/SESSION-21-SCENARIOS.md) links model obligations with independent tests.

| Export | Canonical source | Detailed guide | Required public index |
|---|---|---|---|
| `timeInterval` | [Clock model](../src/models/session21-clock.ts) | [Clock readings](../docs/SESSION-21-CLOCKS.md) | [timeInterval](../operators/timeInterval-index.md) |
| `timestamp` | [Clock model](../src/models/session21-clock.ts) | [Clock readings](../docs/SESSION-21-CLOCKS.md) | [timestamp](../operators/timestamp-index.md) |
| `timeout` | [Deadline model](../src/models/session21-timeout.ts) | [Timeout policies](../docs/SESSION-21-TIMEOUTS.md) | [timeout](../operators/timeout-index.md) |
| `timeoutWith` | Same deadline kernel with alias configuration | [Timeout policies](../docs/SESSION-21-TIMEOUTS.md) | [timeoutWith](../operators/timeoutWith-index.md) |
| `window` | [Window model](../src/models/session21-window.ts) | [Window lifetimes](../docs/SESSION-21-WINDOW.md) | [window](../operators/window-index.md) |

Eleven configured examples produce **93 new projections**: eight views for each example plus five export-level inspection indexes. The window examples are three histories of one semantic profile. The locally generated and drift-verified registry is **1,097 ordinary projections + 3 specialized mergeWith projections**. Committed CI verification is recorded separately below.

## Source and verification design

RxJS remains pinned to **7.8.2**, with source links at revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). All five operator implementations and corresponding upstream spec bodies are inspection inputs. The upstream RxJS test suite is not claimed to have been executed. Existing schema, runner, renderers, validation workflow, strict TypeScript settings and dependency pins are retained.

| Family | Model tests | Native RxJS tests | Differential tests | Type assertions |
|---|---|---|---|---|
| Clock readings | [Models](../tests/session21-clock-model.test.mjs) | [Native](../tests/session21-clock-rxjs.test.mjs) | [Comparisons](../tests/session21-clock-differential.test.mjs) | [Strict types](../tests/types/session21-clock.ts) |
| Deadlines | [Models](../tests/session21-timeout-model.test.mjs) | [Native](../tests/session21-timeout-rxjs.test.mjs) | [Comparisons](../tests/session21-timeout-differential.test.mjs) | [Strict types](../tests/types/session21-timeout.ts) |
| Windows | [Models](../tests/session21-window-model.test.mjs) | [Native](../tests/session21-window-rxjs.test.mjs) | [Comparisons](../tests/session21-window-differential.test.mjs) | [Strict types](../tests/types/session21-window.ts) |

Two additional [artifact tests](../tests/session21-artifacts.test.mjs) verify exact example grouping and the complete eleven-step navigation across all five committed indexes. The normal drift check owns byte-for-byte projection consistency and canonical trace replay.

### New test and comparison inventory

| Family | Model | Native RxJS | Differential | Negative TypeScript assertions | Comparison executions |
|---|---:|---:|---:|---:|---:|
| `timeInterval` / `timestamp` | 19 | 17 | 2 | 12 | 288 + 288 = 576 |
| `timeout` / `timeoutWith` | 29 | 24 | 2 | 16 | 432 + 216 = 648 |
| `window` | 15 | 17 | 1 | 12 | 1,500 |
| **Family totals** | **63** | **58** | **5** | **40** | **2,724** |

The families contribute 126 named tests; the two navigation checks bring the total to **128 new named tests**. With the retained 1,416-test baseline, the full suite contains **1,544 tests**. Compiler assertions are counted separately. The second, uninstrumented scheduler runs in timeout comparisons check observation transparency and are not counted as additional model/native comparison executions. Default TimeoutError prototypes are covered by dedicated native tests, while timeout differential comparisons cover factory and alias profiles.

## Executed checks and corrections

The complete local integration passed `npm run generate` followed by the unchanged `npm run check` on **Node v24.22.3**. Results: syntax passed; strict TypeScript passed, including all 40 new negative assertions; **1,544 tests passed, zero failed, zero skipped**; all **2,724** Session 21 comparisons passed; and **1,097 ordinary + 3 specialized projections** exactly matched regeneration. All local links in the six Session 21 guide/evidence documents resolve.

An early parallel build reported a TypeScript error from a concatenated timeout event string being inferred too broadly. It was corrected to the explicit event union before the full successful check. Read-only semantic review also found that the timeout validator admitted unreachable first-only states: a satisfied source could retain a watchdog, or an expiry factory phase could claim positive `seen`. The validator and existing invalid-state test were strengthened to reject both, along with inconsistent timer counters and nonfuture stored armed deadlines. These corrections did not change reachable RxJS policy transitions or relax any check.

Focused source review and tests also pin the RxJS 7.8.2 detail that original-source finalization clears `lastValue` before timeout factory info is constructed: `meta` and `seen` survive, while `lastValue` is null. Window disposal is distinguished from inner completion; a disposed current handle throws on late subscription, whereas an older rotated completed handle still completes late observers. These are actual native observations under the documented scope, not assumptions inferred from the generated pages.

## Committed CI and projection provenance

Implementation [PR #42](https://github.com/hansschenker/rxjs-formal-way/pull/42) committed all models, tests, guides and **93 new generated files** at [`ff2568b979f584ae54e0505cce0b9932fd323c69`](https://github.com/hansschenker/rxjs-formal-way/commit/ff2568b979f584ae54e0505cce0b9932fd323c69). Its [CI run 44248539312](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44248539312), job `134613289797`, succeeded. The actual synthetic checkout was `130ef45e666f084f4876cbeb195eaef9c2911f9f`; independently retrieved commit objects for that checkout and the PR head have identical tree `458f9f5931a9cc4c2606bfeca054fefee4dc2aa9`.

The implementation merged as [`fa4579468c231b531585a0473c1a0c934fbb55d4`](https://github.com/hansschenker/rxjs-formal-way/commit/fa4579468c231b531585a0473c1a0c934fbb55d4). [Main push CI 44248935292](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44248935292), job `134614579068`, checked out exactly that SHA and passed on **Node v22.16.0**. Retrieved logs report **1,544 tests passed, zero failed, zero skipped**, strict types and syntax success, Session 21 comparison counts **288 + 288 + 432 + 216 + 1,500 = 2,724**, and **1,097 ordinary + 3 specialized projections** regenerated and drift-verified.

Both main-only generation and publication steps succeeded. Regeneration found no artifact changes, so no additional generated-file commit was made; independently retrieved live `main` remained `fa4579468c231b531585a0473c1a0c934fbb55d4`. The original implementation commit is therefore also the generated-artifact commit. No workflow, dependency, schema or renderer was changed.

## Independent read-only verification

This evidence-only follow-up changes no canonical model, test, generated projection, workflow or dependency. The unchanged pull-request path will check the complete committed tree with both generation and publication skipped. Final acceptance remains pending until that separate run, its actual checkout, and its tree identity have been retrieved and recorded.

## Evidence limits

Clock readings are distinct from execution timestamps; supported finite provider readings can be negative, fractional, repeated or decreasing. The structural model of `timeInterval` output does not promise its native prototype. Timeout profiles use positive bounded relative durations, future absolute deadlines and deferred scheduler delivery under the declared setup assumptions. Window profiles distinguish current-window disposal, retained completed handles and independently owned consumer subscriptions.

Default error construction, prototype exposure, synchronous setup and unsupported parameter/input cases may be characterized by specifically named native tests without enlarging the canonical profiles. See the family guides for exact boundaries. Finite comparison executions need not represent distinct histories, and reachable-rule witnesses do not establish universal guard totality or unrestricted equivalence. A release action records connection teardown, not an independent proof that every external producer side effect stops.

## Closure

Acceptance and inventory updates remain pending. The next untouched five after successful acceptance are `windowCount`, `windowTime`, `windowToggle`, `windowWhen`, and `withLatestFrom`. No sixth export belongs to Session 21.
