# Session 21: live windows controlled by a boundary stream

**Export:** `window`. **RxJS:** 7.8.2, pinned revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). This guide describes one semantic profile through three generated histories. It does not count those histories as extra public exports. Executed checks and acceptance belong to the [Session 21 evidence ledger](../evidence/SESSION-21.md).

## Intuition

`window(boundaries$)` creates a stream of live streams. Connecting to the result immediately gives the outer observer its first window. Source values flow into that window. Whenever the boundary stream emits a value, the current window completes and a new window is announced. The boundary value itself is ignored.

Each window carries values while they arrive. It does not collect an array and does not replay earlier values to a consumer that attaches late. Several consumers can observe the same current window; all receive the same payload references from the time they attach. A second connection to the outer result creates a separate set of windows and input subscriptions.

For source values `A@1, B@3, C@5`, a boundary next at 4 separates the values into a first window containing A/B and a second containing C, provided each consumer was connected when its values arrived. The initial window is announced at result connection time; the second is announced at 4. Time comes from the source, boundary and consumer events. `window` creates no timer or clock.

Three lifecycle distinctions matter:

- Boundary **next** completes the current window and opens another, even when the old one had no values.
- Boundary **complete** releases that boundary connection. The source, current window and outer result remain live.
- Outer **cancellation** releases source and boundary, then unsubscribes the current Subject itself. Existing inner Subscription objects receive no terminal notification and remain open until their consumers close them.

The last behavior differs from `groupBy`'s retained source leases: a window consumer never keeps the original source alive after the outer connection closes. The pinned [window implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/window.ts) and [Subject lifecycle](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts) establish these policies.

### Cω-style shape

`window : Cω(BoundarySignal) → T* → Observable<T>*`

The outer sequence contains one initial window plus one new window for each accepted boundary next. Each inner sequence contains only the source values delivered while that window is current and that observer is connected. Empty windows are legal. The shape describes values; successful completion, failure, cancellation and handle invalidation are separate lifecycle behavior.

## Specification

The [canonical model](../src/models/session21-window.ts) is an extended Mealy observation model, **`M = (S, S₀, Z, A, T, G)`**. Its transition functions are pure. Emitting a `WindowToken` names an Observable handle; it does not construct a native Observable. Addressed consumer actions describe independently observable notifications and subscription lifetimes.

| Component | Definition |
|---|---|
| `S` | `Unsubscribed`; `Active(memory)`; `Stopped(memory,reason)`. Memory contains the current window ID, whether boundary is live, a consecutive window-handle registry, active/orphaned consumer records, and previously used observer identities. |
| `S₀` | `Unsubscribed`, with no source, boundary, window or consumer resource. |
| `Z` | Outer subscribe/cancel; source next/complete/error; boundary next/complete/error; explicit window-consumer subscribe/unsubscribe. Source payloads and error payloads are opaque. |
| `A` | Outer window-token/terminal notifications; addressed window-consumer next/terminal notifications; source, boundary and consumer acquisition/release actions. No scheduling or callback action. |
| `T` | Initialize window zero; route values without retaining them; rotate windows on boundary next; remember boundary completion; close the outer execution on source terminal, boundary error or cancellation; independently track consumer connections and completed historical handles. |
| `G` | Announce initial handle before acquiring source, then boundary. Deliver source values to current consumers in attachment order. Complete/error each current consumer before outer terminal. Release the relevant inputs. Outer cancellation sends no notification and does not fabricate consumer-unsubscribe actions. |

Window handles have three statuses: **open**, **complete**, and **invalid**. Every rotated historical window is complete. The current window is open while the outer execution is Active. Final outer teardown invalidates the current Subject, including after it has notified completion/error. This differs from simply retaining a completed current Subject for future use.

`Stopped` means the outer/source execution ended, not that every observation is impossible. A previously rotated handle can still complete a late subscriber. After outer cancellation, a previously attached consumer can still close its own orphaned Subscription. For that reason the metadata does not mark `Stopped` as a fully terminal observation state.

### Input Controller: legal events depend on current ownership

| State / event | Guard and memory change |
|---|---|
| Unsubscribed / subscribe | Create window zero, source ownership and live boundary ownership. |
| Active / source next | Route to current consumers. Preserve window and input ownership; retain no value history. |
| Active / boundary next | Require live boundary and safe next identity. Mark old window complete; remove its completed consumers; create new open window. |
| Active / boundary complete | Require live boundary. Set boundary ownership false; preserve source/current window. |
| Active / source complete or source error | Mark current handle invalid, remove terminally notified consumers, clear input ownership; become Stopped. |
| Active / boundary error | Require live boundary. Apply the same failure/teardown policy as source error. |
| Active / outer cancel | Mark current handle invalid and clear input ownership; preserve current consumer records as orphaned open subscriptions. |
| Active / subscribe to current window | Require known open handle and a fresh, nonempty observer identity; add that consumer. |
| Active or Stopped / subscribe to an older completed window | Require known completed handle and fresh observer identity. Record the attempt; retain no active consumer. |
| Active or Stopped / consumer unsubscribe | Require that exact consumer subscription to remain open; remove only it. |

The runner rejects unknown handles, duplicate observer identities, stale boundary events after boundary completion, input notifications after outer termination, and cancellation of an already closed consumer. Every observer identity denotes one subscription occurrence. Reconnecting the same application observer therefore uses a fresh modeled occurrence ID.

### Action Policy: order is part of the observation

| Trigger | Ordered action word |
|---|---|
| Initial outer connection | Outer next(window 0) → source acquire → boundary acquire. |
| Source value | Next(value) to each current consumer in attachment order. If none are attached, no consumer observes it. |
| Boundary next | For each current consumer: complete then release its subscription. Afterwards announce the new window. |
| Boundary complete | Release boundary only. |
| Source complete | Complete/release current consumers → outer complete → release source → release boundary if still live. |
| Source or live boundary error | Error/release current consumers → outer error with the same payload → release source → release boundary if still live. |
| Outer cancel | Release source → release any live boundary. No window/outer terminal and no consumer Subscription closure. |
| Attach to older completed handle | Attempt consumer acquisition → immediate complete → release consumer subscription. No source acquisition and no replay. |
| Consumer cancel | Release only that consumer subscription. |

Subject invalidation occurs during operator teardown and is represented in state. It is not a downstream notification or an invented child-subscription close action. Native tests assert that an orphaned child remains `.closed === false` after outer cancellation and becomes closed only when its consumer unsubscribes.

## Sharing, retained handles and scope

Each outer subscription owns one source connection and initially one boundary connection. Windows multicast source notifications to their own consumers without buffering. Subscribing to a window neither creates a second source connection nor adds a lease that delays outer teardown. Previous windows retain completion status only; the model's historical registry represents handles retained by consumers, not an ever-growing registry inside the native operator.

The model covers Observable boundary inputs, observable-facing window consumers, nonthrowing observer/teardown behavior, and nonreentrant notifications **after input setup has returned**. Consumer attachment occurs between modeled reactions. Equal-time event order is supplied explicitly. Generated histories use the existing generic `runTrace`; this operator does not read a scheduler or provider clock.

The following implementation details are independently characterized without expanding that canonical scope:

- The initial handle is `windowSubject.asObservable()`, while later boundary rotations emit the Subject object itself. Tokens normalize that prototype distinction. Imperative calls to later Subject methods are outside the model.
- After outer teardown, subscribing to the invalidated current handle throws an actual `ObjectUnsubscribedError` synchronously. This happens for both the initial wrapper and later Subject handles, even when an error handler was supplied. Invalidated-handle subscription is intentionally outside the model's legal event alphabet.
- A synchronous source can complete before boundary setup. RxJS still attempts boundary subscription with an already closed subscriber and immediately tears it down. The canonical START word assumes post-setup delivery; a dedicated native test records this setup case.
- A synchronous EMPTY boundary can complete during setup while source/current window remain live. This confirms boundary-complete policy but is outside the atomic setup profile.

Other exclusions are Promise/Iterable and invalid boundary conversion, observer-triggered reentry, exceptions thrown by observers or teardown, and physical prototype equivalence. A request to unsubscribe a producer connection is not proof that every external side effect physically stops. A silent source and boundary can leave the current window open indefinitely; no universal liveness guarantee is asserted.

## Verification

| Evidence | Concrete obligation |
|---|---|
| [15 model tests](../tests/session21-window-model.test.mjs) | Initialization and action ordering, multicast/no replay, boundary completion, exact errors, orphaned consumers, late completed handles, illegal events, state constraints, immutable updates, and three executable histories. |
| `S21 WINDOW REACHABILITY: explicit legal prefixes witness every retained guarded rule` | Four explicit legal paths exercise all **13 retained rule IDs**. This is rule-witness coverage, not complete state-space exploration or universal guard totality. |
| [17 independent native tests](../tests/session21-window-rxjs.test.mjs) | Actual RxJS behavior with literal expectations; no canonical model import. Includes prototype exposure, invalidated handles, synchronous setup and a TestScheduler golden history. |
| [One differential test](../tests/session21-window-differential.test.mjs) | **1,500 finite comparison executions** of ordered outer/inner outputs, input subscriptions and consumer lifetimes. |
| [12 negative TypeScript assertions](../tests/types/session21-window.ts) | Reject malformed payloads, input events, handle/observer IDs, registry records and missing phase memory. Compiler checks are not additional runtime test cases. |

The differential parameter space is **three initial consumer counts (0/1/2) × five command choices³ × four endings = 1,500**. Commands are source next, boundary next, boundary complete, consumer attach and consumer detach. Endings are source complete, source error, boundary error and outer cancellation. Retained old-handle subscription and final consumer cleanup are also observed where applicable. Values include `undefined`, `null` and a shared opaque object; errors use an opaque object.

The adapter executes RxJS first and records actual actions and accepted inputs. It uses native subscription state to ignore commands aimed at already closed connections. It then replays the accepted input history through the model. Model state never decides what native RxJS should do. Explicit handle normalization names windows by actual outer emission order. Some parameter schedules collapse to the same accepted history, so 1,500 is an execution count, not a distinct-history or exhaustive-equivalence count.

The separate TestScheduler test uses source `-a-b-c-|` and boundary `---x-|`. At the shared frame, source B arrives before the boundary next because of the actual registration order: A/B belong to window zero, C to window one. The test also asserts source and boundary subscription intervals. No claim is made that all same-time schedules use that order.

### Scenario entry points

| Canonical rule group | Named native test entry point |
|---|---|
| START | `S21 RX window: construction is lazy; initial handle precedes source then boundary acquisition` |
| SOURCE-NEXT / OBSERVER-LIVE | `S21 RX window: live multicast consumers receive identical values without replay or outer value forwarding` |
| BOUNDARY-NEXT | `S21 RX window: boundary next completes old observers before publishing a fresh window` |
| BOUNDARY-COMPLETE | `S21 RX window: boundary completion does not close current window or outer result` |
| SOURCE-COMPLETE | `S21 RX window: successful source terminal reaches current window before outer and source-boundary teardown` |
| SOURCE-ERROR / BOUNDARY-ERROR | `S21 RX window: {source|boundary} error preserves identity and window-before-outer cleanup` |
| CANCEL / OBSERVER-UNSUBSCRIBE-STOPPED | `S21 RX window: outer cancellation disconnects inputs but leaves existing child subscriptions open and silent` |
| OBSERVER-UNSUBSCRIBE-ACTIVE | `S21 RX window: closing all window observers does not disconnect or terminate the source window` |
| OBSERVER-COMPLETE-ACTIVE / STOPPED | `S21 RX window: older rotated handles complete late subscribers without replay before and after outer stop` |

Full obligation IDs prepend `S21-WINDOW-` to these suffixes. They are canonical rule IDs, not literal test titles; the explicit witness test compares the exercised ID set with all retained rules.

## Generated histories and source basis

The [window inspection index](../operators/window-index.md) groups `window` (rotation, successful source completion and a retained old handle), `window-boundary-complete` (boundary stops while source continues), and `window-cancel` (outer teardown followed by orphaned-consumer cleanup). These are **three histories of one semantic profile**. Their generated traces are model predictions; native tests supply independent observations.

The pinned [upstream window spec bodies](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/window-spec.ts) were inspected, not executed as the upstream suite. Their fixtures cover rotation, empty/never sources, input failures, early unsubscription and boundary completion. The test title suggesting that closing-stream completion completes the result is misleading: its actual expected timeline keeps the current window/source running until source completion. Local expectations follow the test body and implementation. Promise-based upstream cases remain outside the declared model. The fetched pinned `window.ts` exactly matches the installed RxJS 7.8.2 source inspected here.
