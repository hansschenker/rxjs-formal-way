# Session 22 — Window policies and source-triggered latest values

**Session:** reserved on 19 November 2026, continued on 20 November, Europe/Zurich. The original five exports are `windowCount`, `windowTime`, `windowToggle`, `windowWhen`, and `withLatestFrom`. The [original record](../planning/sessions/2026-11-19.json), [continuation](../planning/sessions/2026-11-20.json), and [evidence ledger](../evidence/SESSION-22.md) record execution and acceptance. This continuation adds no sixth export.

## Intuition: what flows and what controls it

The four window operators emit **live inner streams**. A source value is delivered to the observers currently connected to each applicable window. Values are not collected into a buffered array, and new inner observers do not receive past values. The control policy determines when a window exists and which subsequent values reach it.

`withLatestFrom` keeps one latest value per auxiliary input. Only a source value can trigger output, and only after all auxiliaries have supplied a value. Early source values are discarded; becoming ready does not replay them.

| Export | Control policy | What a new source value does |
|---|---|---|
| `windowCount` | Open and close windows by source-value counts; stride selects contiguous, overlapping or gapped windows. | Deliver to all current windows, close the count-complete oldest window, then announce a successor when the stride boundary is reached. |
| `windowTime` | Scheduler events open/close windows; an optional maximum size can close a window early. | Deliver through the current window list, applying each window's size closure in order. Sequential mode restarts after closure; periodic creation can overlap or leave gaps. |
| `windowToggle` | An opening signal creates a window; its closing-selector function sets up that window's closing signal. | Deliver to every current window. A closing **next** closes its window; an empty closing completion leaves it open. |
| `windowWhen` | Set up a fresh closing signal for each successive window. | Deliver to the current window. Either closing **next or complete** replaces it, using a new closing-signal setup. |
| `withLatestFrom` | Source events trigger; auxiliary events update remembered values. | If every auxiliary has supplied a value, emit a fresh tuple containing the source value and current auxiliary values; otherwise emit nothing. |

Payloads remain opaque. Window controls route unchanged values, while the latest-value operator builds a tuple whose members retain their original identity. The source, scheduler and signal streams determine when events arrive.

## Specification: five explicit machines

Each definition supplies **`M = (S, S₀, Z, A, T, G)`**: complete state, initial state, legal input events, ordered actions, next-state function and action function. Named guarded rules reject illegal event/state combinations. The existing schema, pure runner and renderers are reused; model actions describe effects without subscribing to producers or invoking user functions.

| Export | Detailed six-tuple, Cω and scenario guide | Canonical model | Public inspection index |
|---|---|---|---|
| `windowCount` | [Count policies](SESSION-22-COUNT-WINDOWS.md) | [Model](../src/models/session22-windowCount.ts) | [Inspect](../operators/windowCount-index.md) |
| `windowTime` | [Timed policies](SESSION-22-TIMED-WINDOWS.md) | [Model](../src/models/session22-windowTime.ts) | [Inspect](../operators/windowTime-index.md) |
| `windowToggle` | [Opening/closing signals](SESSION-22-TOGGLE-WINDOWS.md) | [Model](../src/models/session22-windowToggle.ts) | [Inspect](../operators/windowToggle-index.md) |
| `windowWhen` | [Successive closing signals](SESSION-22-WHEN-WINDOWS.md) | [Model](../src/models/session22-windowWhen.ts) | [Inspect](../operators/windowWhen-index.md) |
| `withLatestFrom` | [Source-triggered latest gate](SESSION-22-LATEST-GATE.md) | [Model](../src/models/session22-withLatestFrom.ts) | [Inspect](../operators/withLatestFrom-index.md) |

### Time and cancellation

Count windows and latest-value gating introduce no clock. Toggle/When windows are controlled by supplied signal notifications. Timed windows explicitly distinguish supplied scheduler time, remembered deadlines, current timer identities and delivered timer events. A deadline stored in model memory does not cause a transition by itself. Equal-time inputs require an explicit order.

The window families have distinct cleanup policies. A completed window remembers completion for late observers; a failed window can retain its error; an outer cancellation may leave an open orphaned Subject whose observers still own their connections. The detailed guides distinguish these cases and any invalidated handles. They also specify the exact order of source, opening, closing and timer teardown. A child observer closing its connection does not hold or cancel an independent upstream lease.

Every outer subscription creates independent bookkeeping. The emitted window streams are live multicast within that outer execution, with no replay. `withLatestFrom` introduces no sharing of source or auxiliary connections. Cancellation is distinct from completion throughout.

## Verification: generated views and native observations

Fifteen configured examples produce **120 per-example views plus five public indexes: 125 Session 22 projections**. Forty-two were committed during the original partial work; this continuation adds the remaining 83 and regenerates any affected earlier views after corrections. The expected complete registry is **1,222 ordinary + 3 specialized projections**. The [ledger](../evidence/SESSION-22.md) records which commands and committed CI checks have actually passed.

Each index exposes Overview, Diagram, STT, BDD, Trace, Obligations, Manifest, Canonical Model, pinned RxJS source, Tests and Evidence. Navigation tests check all five indexes and their exact example membership. Normal generation checking owns byte-for-byte consistency and trace replay.

Model tests check guards, immutable transitions and concrete legal rule witnesses. Native tests independently execute RxJS 7.8.2 with literal expectations. Differential tests record actual notifications, connection lifetimes, timer/signal actions and supported callback outcomes before replaying the accepted history through the pure model. Model state does not decide native execution. The [scenario map](SESSION-22-SCENARIOS.md) links these obligations to tests.

The pinned implementation and upstream spec bodies are source evidence; the upstream RxJS test suite is not claimed to have been executed. Finite comparisons can contain repeated histories and do not prove all states, arbitrary reentrancy or unrestricted infinite-trace equivalence. Parameter, setup and callback scope limits remain explicit in each guide.
