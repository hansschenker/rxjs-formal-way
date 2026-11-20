# Session 22: windows opened and closed by signals

**Export:** `windowToggle`. **RxJS:** 7.8.2 at pinned revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). This guide describes one semantic profile through three example histories. Executed integration checks and acceptance belong to the [Session 22 evidence ledger](../evidence/SESSION-22.md).

## Intuition

`windowToggle(openings$, closingSelector)` routes source values into live windows. Each opening value asks the selector to set up a closing signal for a new window. Once that setup returns a valid Observable, the outer observer receives the window handle and the operator connects to its closing signal. Several windows can be open together. There is no initial window before the first opening value.

The source carries domain values. The opening stream carries values for the user's setup function. Each closing stream carries control signals. RxJS does not interpret the domain payloads or buffer them into arrays: a source value is delivered to the connected consumers of every currently open window, preserving its reference. A consumer that connects late misses earlier values.

For example, source values A/B/C/D arrive at times 1/3/5/7. Open windows at times 2 and 4, then close them at 6 and 8. Connected consumers of window zero see B/C; consumers of window one see C/D. A arrives with no open window and is dropped. The outer stream announces the two window handles at times 2 and 4. Time comes from those source and signal notifications; this operator introduces no clock or timer.

The following are distinct policies in the pinned implementation:

| Input | Effect on windows |
|---|---|
| Opening **next** | Invoke the closing-signal setup function; announce a new window on success. |
| Opening **complete** | Stop accepting new openings. Existing windows and the source continue. |
| Closing **next** | Complete that closing signal's own window and disconnect that signal. Other windows continue. |
| Closing **complete** | Disconnect that signal only. Its window stays open. |
| Source **complete** | Complete all current windows, then complete the outer result. |
| Source, closing-signal or selector **error** | Error all current windows, then error the outer result. |
| Opening **error** | Error the outer result and silently dispose current Subjects. Existing child subscriptions receive no terminal notification. |
| Outer **cancel** | Disconnect inputs and silently dispose current Subjects; existing child subscriptions remain independently closeable. |

The difference between an opening error and the other errors follows the actual [RxJS 7.8.2 source](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowToggle.ts): only source, closing and selector errors use its `handleError` routine. The opening subscriber uses the default error path. The native tests explicitly preserve this distinction.

### Cω shape

`windowToggle : (O* × (O! → C*)) → T* → (T*)*`

`O*` is the opening signal, `O! → C*` sets up a closing signal from one opening value, and each emitted `T*` is a live window. A window can carry no values; overlapping windows can carry the same source value. Successful completion, error, connection cancellation and handle disposal are separate lifecycle behavior, not extra value constructors in this shorthand.

## Specification

The [canonical TypeScript model](../src/models/session22-windowToggle.ts) defines the pure machine **`M = (S, S₀, Z, A, T, G)`**. Its actions describe effects; it never runs a selector, subscribes to a producer or constructs a native Observable.

| Component | Explicit definition |
|---|---|
| **S** | `Unsubscribed`; `Active(memory)`; `Selecting(memory,pending)`; `Stopped(memory,reason)`. Memory holds the next safe-integer window identity, opening liveness, historical window records, attached/orphaned consumers and used observer identities. Each window records status, whether it was announced, closing-subscription liveness and its error where applicable. |
| **S₀** | `Unsubscribed`, with no source, opening, closing or child-consumer connection. |
| **Z** | Outer subscribe/cancel; source next/complete/error; opening next/complete/error; correlated selector return/throw; generation-addressed closing next/complete/error; independent window-consumer subscribe/unsubscribe. Source payload `T`, opening payload `O` and errors remain opaque. |
| **A** | Source/opening/closing/consumer subscribe and unsubscribe; correlated selector invocation; outer window-token/terminal notifications; addressed child next/terminal notifications. There is no scheduling action. |
| **T** | Acquire initial inputs; allocate a private pending window; admit a successful selector outcome or fail; route values to current windows; close individual windows on closing next; remember signal completion; stop outer execution while retaining observable historical handles and independent orphaned consumers. |
| **G** | Opening acquisition precedes source acquisition. Selector invocation precedes window announcement, which precedes closing acquisition. Child terminals precede outer terminal for source/closing/selector failures and source completion. Input teardown follows connection insertion order. Opening failure and cancellation fabricate no child terminal or child-unsubscribe action. |

The window registry is an observation model of handles retained by consumers. It does not claim that native `windowToggle` retains all old Subjects in its active array. Native Subjects are removed from that array on normal closure; their handles remain usable when an application has retained them.

### Input Controller: state-dependent legality

| Control and input | Guard and next-state policy |
|---|---|
| Unsubscribed / subscribe | Become Active with no windows; acquire opening then source. |
| Active / opening next | Require live opening and safe identity increment. Add one unannounced pending record; enter Selecting; request the selector with the original opening value. |
| Selecting / return or throw | Require the matching `closingSelector` generation. Return admits the pending window; throw terminates without announcing that window. No source, signal, cancellation or consumer event may interleave. |
| Active / source next | Deliver to open windows in creation order and each window's consumers in attachment order. Retain no source value history. |
| Active / closing next | Require a live closing occurrence with the matching generation. Complete its window and remove its current consumers. |
| Active / closing complete | Require that closing occurrence to remain live. Clear only its liveness bit. |
| Active / opening complete | Require live opening. Clear opening liveness without changing the current windows. |
| Active / source complete or source/closing failure | Stop; current windows retain completion/error and no child remains attached. Closing failure requires a live identified closing occurrence. |
| Active / opening error or cancel | Stop; current window records become disposed, and their attached child subscriptions remain as orphaned consumer records. |
| Active / attach to open handle | Require an announced open handle and fresh nonempty observer identity. Acquire one independent consumer; do not replay. |
| Active or Stopped / attach to completed handle | Require an announced completed handle and fresh identity. Deliver completion immediately and retain no consumer. |
| Stopped / attach to failed handle | Require an announced failed handle and fresh identity. Deliver the same retained error immediately, including `undefined` when that was the error. |
| Active or Stopped / child unsubscribe | Require the named consumer to remain attached or orphaned. Release only that consumer. |

The state validator rejects impossible pending identities, illegal status/liveness combinations, duplicate or unregistered consumers, unannounced public handles, failed records without an error field, and terminal window states that conflict with the outer stop reason. A selector failure must retain its final private failed record; it cannot be fabricated by relabeling an ordinary source-error state. Guards reject stale closing generations, completed opening notifications and all source/signal activity after the outer execution stops.

`Stopped` is deliberately not marked fully terminal in the metadata. A completed or failed handle can still notify a later consumer, and an orphaned child Subscription can still be closed independently. Those observations do not reacquire source, opening or closing subscriptions.

### Action Policy: order and ownership

| Trigger | Ordered actions |
|---|---|
| Outer connection | Acquire opening → acquire source; no initial outer next. |
| Opening value | Invoke selector with its exact value and a fresh invocation/window generation. |
| Valid selector outcome | Outer next(window token) → acquire that window's closing connection. |
| Source value | Deliver the same value to each current window consumer; no outer value notification. |
| Closing next | For each consumer of that window, complete then release its child subscription → release that closing connection. |
| Closing or opening complete | Release only the corresponding signal connection. |
| Source completion | Complete/release current window consumers → outer complete → release live opening → release source → release remaining closing connections in creation order. |
| Source/closing/selector failure | Error/release current window consumers → outer error → the same input release order. |
| Opening failure | Outer error → release live opening → release source and dispose current Subjects → release live closings. Child Subscriptions receive no terminal. |
| Outer cancellation | Same input disposal, with no outer or child notification. |
| Attach to retained terminal handle | Acquire child → deliver retained complete/error only → release child. |
| Child cancellation | Release only that child; source lifetime does not depend on consumer count. |

An internal Subject's disposal is represented by its window record, not by inventing a consumer-unsubscribe action. A disposed Subject and the Subscription returned to a consumer are different objects. The native tests confirm that these child Subscriptions remain `.closed === false` until the consumers close them.

### Time, sharing and scope

The model admits nonreentrant notifications after opening/source/closing subscription setup has returned. Each selector is synchronous and returns a valid Observable or throws. `selector.return` abstracts that valid result; per-window closing generations identify distinct subscription occurrences even when two selector calls return the same Observable instance. A native test separately confirms the shared-signal case.

`runWindowToggleTrace` uses the existing runner and enforces that the selector return/throw shares its invocation's envelope time. Generic `stepModel` checks correlation and state legality but has no timestamp argument. A trace can stop at Selecting as an explicitly partial reaction prefix; that prefix does not claim that a synchronous native reaction has finished. Equal-time inputs retain supplied array order.

Every outer connection creates independent bookkeeping and input connections. Each inner window is live multicast without replay. Inner consumers hold no lease on the source: outer cancellation disconnects the source even if children remain attached. Signals and source Observables may themselves be shared; the model does not introduce upstream sharing.

The canonical profile excludes acquisition-time synchronous notifications, source/selector/observer reentrancy, foreign ObservableInput conversions, invalid selector results, direct Subject mutation, throwing observer/producer teardown and unsafe identity overflow. Attaching during an outer `next` handler is a nested reaction; canonical examples and differential executions attach between reactions. Native tests also characterize selected synchronous setup cases without widening the canonical profile.

Late attachment to a currently disposed handle throws an actual `ObjectUnsubscribedError` synchronously, even with a supplied error callback. This call is outside the legal model event alphabet and has a dedicated native assertion. Historical completed handles and handles failed through `handleError` remain usable and replay their terminal only. These details follow the pinned [Subject implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts) and [OperatorSubscriber cleanup](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts).

## Verification

| Evidence | Checked obligations |
|---|---|
| [22 model tests](../tests/session22-windowToggle-model.test.mjs) | Exact action order, overlapping live delivery, signal completion, distinct error paths, retained handles/orphans, invalid states/events, same-time selector outcomes, immutable bookkeeping and all three example histories. |
| `S22 TOGGLE MODEL: legal finite witnesses exercise every retained guarded rule` | Explicit legal paths exercise all **19 guarded rule IDs**. This does not prove universal guard totality or exhaust the state space. |
| [19 independent native tests](../tests/session22-windowToggle-rxjs.test.mjs) | Actual RxJS with literal expectations, no model import; includes producer/consumer lifetimes, identity, signal sharing, disposal, invalid returns, synchronous setup and a scheduler-controlled history. |
| [One differential test](../tests/session22-windowToggle-differential.test.mjs) | **2,592 native-first comparison executions** of exact ordered notifications, selector invocations/outcomes and connection lifetimes. |
| [16 negative TypeScript assertions](../tests/types/session22-windowToggle.ts) | Reject missing payloads, wrong source/opening types, uncorrelated outcomes, malformed signal/consumer events and incomplete phase memory. Compiler assertions are counted separately from runtime tests. |

The differential parameter space is **two consumers-per-opening settings (0/1) × six commands³ × six endings = 2,592**. Commands open another window, emit a source value, deliver closing next/complete, attach a consumer, or complete the opening signal. Endings are source complete/error, opening error, closing error, selector throw and outer cancellation. Each execution starts with one post-setup opening. Unsupported commands directed at already closed native subscriptions are ignored. Final outer cancellation and orphaned-child cleanup are explicit, and a retained handle is revisited only after an actual terminal notification on it was observed.

The adapter executes RxJS first. Actual native subscription state controls accepted commands; actual callback outcomes supply the correlated selector events. Only after that execution finishes is the input history replayed through the model. No model state decides what native RxJS should emit. Some parameter schedules collapse to the same accepted history, so 2,592 counts executions rather than unique histories or exhaustive equivalence cases.

The native TestScheduler history uses source `--a-b-c-d-|`, openings `-o---o---|` and each closing `---x|`. Source B at frame 4 is delivered before the first closing at frame 4 because the source action was scheduled earlier; source D similarly precedes the second closing at frame 8. Source completes at frame 10, while openings complete at frame 9. Exact input subscription intervals are asserted. That order is a property of this concrete schedule, not an inferred rule that all equal timestamps imply source-first execution.

### Scenario-to-test entry points

All canonical IDs below have prefix `S22-WINDOWTOGGLE-`.

| Rule group | Native test suffix after `S22 TOGGLE RX:` |
|---|---|
| START | `construction is inert; opening acquisition precedes source with no initial handle` |
| OPEN / SELECTOR-RETURN | `selector sees exact opening value before handle and closing acquisition` |
| SOURCE-NEXT / OBSERVE-OPEN | `source drops values with no windows, then multicasts identical references without replay` |
| CLOSING-NEXT | `closing next completes only its window before closing teardown` |
| CLOSING-COMPLETE | `empty closing completion leaves its window open` |
| OPENING-COMPLETE | `opening completion releases only opening and existing closings keep working` |
| SOURCE-COMPLETE | `source completes children before outer and ownership teardown` |
| SOURCE-ERROR / CLOSING-ERROR | `{source|closing} error reaches children before outer and remains available to late observers` |
| SELECTOR-THROW | `selector throw errors existing windows without announcing the failed window` |
| OPENING-ERROR | `opening error errors only outer and disposes active handles without terminating children` |
| CANCEL / retained completed handles / orphan close | `outer cancellation disposes active handles while old completed handles survive` |
| OBSERVER-CLOSE-ACTIVE | `child cancellation releases no source, opening, sibling or closing subscription` |

## Generated histories and provenance

The [inspection index](../operators/windowToggle-index.md) groups three histories of this one semantic profile: `windowToggle` demonstrates overlapping windows and normal closure; `windowToggle-empty-close` demonstrates both signal completions while source values continue; `windowToggle-cancel` demonstrates silent outer disposal followed by independent child cleanup. The standard generator produces eight views per history plus one public index, **25 projections**. These traces are model predictions; native observations are separate evidence.

The pinned [upstream specification bodies](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/windowToggle-spec.ts) were read as scenario inputs. The fetched pinned implementation byte-matches the installed RxJS 7.8.2 source. The upstream test suite itself was not executed. This work's focused build, 42 named tests and strict type check passed; full committed CI status is owned by the session ledger.

Finite comparisons, rule witnesses and TypeScript checks support only the declared profile. They do not prove unrestricted equivalence, arbitrary reentrancy, universal infinite-trace liveness, or physical cancellation of every external producer side effect.
