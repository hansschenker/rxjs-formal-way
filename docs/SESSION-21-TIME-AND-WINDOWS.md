# Session 21 — Clock readings, deadlines and live windows

**Session date:** 18 November 2026, Europe/Zurich. The user explicitly requested Session 21 after Session 20 closed that day; the [separate reservation](../planning/sessions/2026-11-18-session-21.json) records that specific exception without replacing the earlier record. Exactly five previously pending RxJS 7.8.2 exports belong to this session: `timeInterval`, `timeout`, `timeoutWith`, `timestamp`, and `window`.

The teaching order remains **Intuition → Specification → Verification**, along the project chain **State → Step → Trace → Behavior → Specification → Implementation → Verification**. Acceptance and executed checks are recorded in the [evidence ledger](../evidence/SESSION-21.md), separately from the generated model predictions.

## Intuition: what flows and what controls delivery

| Export | What flows over time | What a new value changes | Source of control |
|---|---|---|---|
| `timeInterval` | A source value together with the difference between two clock readings. | Read the clock, subtract the previous reading, remember the new reading, emit the pair. The first difference starts from the connection's initial reading. | The supplied provider's `now()` readings; no timer is scheduled. |
| `timestamp` | A source value together with one clock reading. | Read the provider and attach that reading to the same value reference. | The supplied timestamp provider; it is read for each value, not at connection. |
| `timeout` | Source values while configured deadlines are met, then an error or values from a replacement stream. | Cancel the preceding deadline before forwarding the value; start another gap deadline only when the configured `each` policy requires one. | A first-value deadline and/or deadlines between values, delivered by the scheduler. |
| `timeoutWith` | The same deadline policy with a configured replacement Observable. | Follow the corresponding `timeout` policy; a timeout acquires the configured replacement after closing the original source. | Numeric due means a repeated gap limit; a Date means a first-value deadline. |
| `window` | An outer stream of live inner streams, each carrying source values for one window. | Route a source value to the current window. A boundary value completes that window and announces its successor. | Notifications from the boundary stream; their payloads do not become output values. |

Values remain opaque. The clock-related operators wrap the value reference with timing information; they do not interpret its domain. A timeout factory describes recovery behavior. A window boundary changes where subsequent values flow. The supplied source, provider, scheduler and boundary stream determine when events arrive.

## Specification: inspect each machine

Each canonical definition supplies **`M = (S, S₀, Z, A, T, G)`**: full state, initial state, input alphabet, action alphabet, next-state function and ordered action function. TypeScript discriminated unions and guards constrain legal state/event combinations; this is an executable specification, not a dependent-type proof of RxJS.

| Detailed guide | Operators | Main distinction |
|---|---|---|
| [Clock-reading machines](SESSION-21-CLOCKS.md) | `timeInterval`, `timestamp` | Event-envelope time and the provider's returned number are separate. A provider can move backwards without the execution itself moving backwards. |
| [Deadline and recovery machines](SESSION-21-TIMEOUTS.md) | `timeout`, `timeoutWith` | First-value deadlines, resettable gap deadlines, current timer generations, original-source teardown, factory outcomes and replacement ownership. |
| [Window machine](SESSION-21-WINDOW.md) | `window` | Outer announcements, current and retained window handles, boundary ownership, inner observers and the difference between completion and disposal. |

The guides contain the five explicit six-tuples, Cω-style shapes, guarded transition policies, scenario mappings, pinned sources and declared limits. The existing schema, pure trace runner and renderers are reused. Model actions describe effects; the model does not subscribe to producers or execute providers, factories or schedulers.

### Time is explicit

A **clock reading** is a value returned by a provider. A **deadline** is remembered data used to decide whether a scheduler event is admissible. A **timer firing** is an input event. Neither a remembered deadline nor an elapsed amount of wall time causes a pure model transition by itself.

For the clock operators, trace-envelope time orders the execution while explicit read outcomes carry provider values. For timeout profiles, supplied scheduler time, deadlines and timer generations govern expiration. Equal-time ordering must be supplied by the execution or test schedule; it is not inferred from timestamps alone. `window` uses source and boundary event order and introduces no clock.

### Cancellation and sharing are explicit

Each outer subscription creates its own bookkeeping. The two clock operators and the timeout operators introduce no implicit source sharing. A configured fallback can itself be shared, but each timeout execution acquires its own connection to it.

`window` creates live multicast window streams inside one outer execution. Inner connections can observe the same current window, and late connections miss values already delivered. Inner observers do not keep the original source connected after the outer execution closes. Outer cancellation and inner completion are different events; the window guide and native tests spell out the resulting observer and retained-handle behavior.

## Verification: generated consistency and independent observations

Eleven configured examples produce **88 profile/history views plus five public inspection indexes: 93 new projections**. The three window examples are different histories of one semantic window profile. The resulting expected registry is **1,097 ordinary projections plus three specialized mergeWith projections**. Counts become verified evidence only after the commands and CI outcomes recorded in the ledger pass.

| Export | Public inspection index | Generated example stems |
|---|---|---|
| `timeInterval` | [Inspect](../operators/timeInterval-index.md) | `timeInterval` |
| `timestamp` | [Inspect](../operators/timestamp-index.md) | `timestamp` |
| `timeout` | [Inspect](../operators/timeout-index.md) | `timeout`, `timeout-first`, `timeout-first-each`, `timeout-absolute-fallback` |
| `timeoutWith` | [Inspect](../operators/timeoutWith-index.md) | `timeoutWith`, `timeoutWith-date` |
| `window` | [Inspect](../operators/window-index.md) | `window`, `window-boundary-complete`, `window-cancel` |

Each index exposes Overview, Diagram, STT, BDD, Trace, Obligations, Manifest, Canonical Mealy Model, pinned RxJS source, Tests and Evidence. Exact regeneration checks establish that the committed projections match the canonical definitions. They do not establish agreement with RxJS by themselves.

Independent native tests execute actual RxJS 7.8.2 with literal expectations. Differential tests record native notifications, timing, callback/provider events and connection lifetimes before comparing them with model predictions. [Scenario and coverage mapping](SESSION-21-SCENARIOS.md) explains those observation boundaries. Finite scenario comparisons and reachable-rule witnesses support scoped claims; they do not prove unrestricted equivalence, arbitrary reentrancy or universal infinite-trace progress.
