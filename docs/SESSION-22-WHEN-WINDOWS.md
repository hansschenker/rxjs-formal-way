# Session 22: successive windows controlled by fresh closing signals

**Export:** `windowWhen`. **Runtime:** RxJS 7.8.2, revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). The [canonical definition](../src/models/session22-windowWhen.ts) supplies one semantic profile and three example histories. Final acceptance and exact CI revisions belong to the [Session 22 evidence ledger](../evidence/SESSION-22.md).

## Intuition: what flows over time

The outer stream announces a live inner window. Source values flow into that window and reach its currently connected observers. A closing signal ends the window on either **next or complete**. The operator then announces a new empty window and asks for its next closing signal.

The zero-argument function sets up that signal. Its returned Observable determines when the next boundary arrives; the function is invoked again for every new window. The closing signal's payload is ignored. No timer, clock or duration is introduced by `windowWhen` itself.

| Incoming event | What changes | What flows outward |
|---|---|---|
| First outer connection | Open window zero and ask for its closing signal; connect closing input before source. | Initial window handle. |
| Source value | Current child observers receive the same opaque value reference. | Inner values; no new outer handle. |
| Current closing next | Close the signal connection, complete current child observers, open a successor, ask for another signal. | Old inner completion, then new outer window handle. |
| Current closing complete | The same rotation policy as closing next. | Old inner completion, then new outer window handle. |
| Source complete | Complete current children and outer, then disconnect inputs. | Inner completion before outer completion. |
| Source or closing error | Fail current children and outer with the identical error. | Inner error before outer error. |
| Outer cancellation | Disconnect source and closing signal. | No notification; the current window becomes silent and orphaned. |

Each window is live multicast with no replay. Two observers of the current window receive the same future source values. A late observer misses earlier values. A child connection does not hold the source open after the outer connection closes.

### Completion and cancellation retain different handles

An older rotated window remembers completion. Subscribing to it later completes immediately, without replaying values. A current window terminated by source or closing failure remembers that error instead. Both remain observable after the outer execution stops.

Outer cancellation does **not** complete or unsubscribe the current Subject. Its already attached child subscriptions remain open, and a late observer can still attach. They receive no future source values because the outer execution has disconnected its inputs. Each child can still close its own subscription. This differs from the current-handle disposal behavior of `window(boundaries)`.

## Specification

### Cω shape

```text
windowWhen :: (() → U*) → T* → (T*)*
```

`T*` denotes the source's sequence of values; each emitted `T*` is a live window, and `U*` supplies its closing notifications. The outer sequence starts with one window and adds one successor per admitted closing next or completion. Empty windows are legal. This value shape does not by itself encode errors, completion, subscription ownership or cancellation; the machine supplies those policies.

### Explicit six-tuple

`M = (S, S₀, Z, A, T, G)`:

| Component | Definition |
|---|---|
| **S** | `Unsubscribed`; `Selecting` with current window identity, retained window registry, used observer IDs and whether source was already connected; `Active` with one live closing occurrence and independently attached child observers; `Stopped` with reason, retained windows and any orphaned consumers. |
| **S₀** | `Unsubscribed`, with no handles, source, closing input or factory invocation. Construction performs no work. |
| **Z** | `subscribe`; source next/complete/error; current-generation closing next/complete/error; correlated factory return/throw; outer cancel; named child subscribe/unsubscribe. Factory return means a valid Observable was returned, abstracted as the next closing subscription occurrence. |
| **A** | Addressed notifications to outer or child observers; source/closing/child subscribe and unsubscribe actions; an explicit `closingSelector` invocation with no argument and generation equal to the new window ID. Actions are descriptions, not executed effects. |
| **T** | The seventeen named guarded transitions in the canonical file update current identity, retained terminal statuses and child ownership. Both closing next and complete move `Active → Selecting`; a matching successful factory outcome moves `Selecting → Active`. |
| **G** | Ordered action words preserve signal teardown before rotation, child terminals before outer terminals, fresh handle announcement before selector invocation, generation-dependent input teardown and silent outer cancellation. |

`Stopped` is deliberately **not marked terminal** in metadata. The outer execution has ended, but retained handles and independently owned child subscriptions can still react to observation or cancellation events.

### State-dependent constraints

- Window identities are consecutive safe integers, from zero through `current`. Older windows must be completed; only the current window may be open or failed.
- During `Selecting`, no current child is attached in this atomic profile. `sourceConnected` is false for the initial invocation and true for every replacement invocation.
- A factory outcome must identify the current invocation. No source, closing, child or cancellation event can interleave before that synchronous outcome.
- A closing notification must identify the current live generation. Removed closing occurrences cannot rotate or fail a later window.
- Child IDs are fresh, nonempty strings. A live child belongs to the current open window; a retained completed or failed handle immediately terminates a newly attached child.
- After ordinary completion/error, no child remains attached. After cancellation, current children and the current open handle can remain as orphans.
- `runWindowWhenTrace` enforces that factory return/throw has the **same envelope time** as its invocation. A trace ending in `Selecting` is an explicitly partial reaction prefix, not a completed native reaction.

These guards and runtime validation reject the tested illegal states and events. Finite witnesses do not constitute a proof over every possible state representation.

### Ordered action policy

| Situation | Ordered observations/actions |
|---|---|
| Start | Announce window zero → invoke factory zero → receive explicit outcome → acquire closer zero → acquire source. |
| Rotate on next or complete | Release current closer → complete and release each child in attachment order → announce new handle → invoke new factory → receive outcome → acquire new closer. |
| Initial-window source terminal, closing error or cancellation | Emit applicable child/outer terminals → release closer zero → release source. Cancellation emits no terminals. |
| Same event after a rotation | Emit applicable child/outer terminals → release source → release current closer. |
| Replacement factory throws | The old closer/window have already closed and the new window was announced → remember error on the new handle → error outer → release source. |
| Initial factory throws | Announce window zero and invoke factory → remember failure/error outer → attempt source subscription with an already closed subscriber → immediately release source. |

The teardown difference after a rotation follows actual subscription registration order. The initial closer is attached before the source; replacement closers are attached after it. Native assertions and differential observations retain this difference instead of normalizing it away.

The initial-failure source attempt assumes a non-notifying, nonthrowing source setup. It is represented by an acquire/release pair, not by a live period in which source values may flow.

## Verification

### Sources inspected

The [pinned operator implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowWhen.ts) and [pinned upstream spec bodies](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/windowWhen-spec.ts) were read. Installed `Subject`, `Subscription` and `OperatorSubscriber` behavior was inspected for handle retention, registration order and teardown. The upstream RxJS suite itself was **not executed**.

| Obligation | Executable evidence |
|---|---|
| Structural metadata, legal starts and all seventeen retained rule IDs | [18 model tests](../tests/session22-windowWhen-model.test.mjs), including finite legal witness prefixes. |
| Initial order, next/complete rotation, teardown order, exact errors, child independence, late handles and cancellation | [18 native tests](../tests/session22-windowWhen-rxjs.test.mjs), with literal expectations independent of the model. |
| Cross-check ordered notifications, factory calls, time and resource lifetimes | [Native-first differential test](../tests/session22-windowWhen-differential.test.mjs), executing **1,876** finite comparisons. |
| Missing generations, missing payload/error, wrong state/control fields and unsupported timer inputs | [14 negative TypeScript assertions](../tests/types/session22-windowWhen.ts). |
| Generated consistency and public navigation | [Export inspection index](../operators/windowWhen-index.md), ordinary generation drift checks and session-wide index tests. |

The focused build, these **37 named tests**, all **1,876 comparisons**, and project strict TypeScript checking passed locally. The session ledger records the complete integration and committed CI outcome separately.

The enumeration uses three initial child-observer counts, five command choices across three positions and five endings: `3 × 5³ × 5 = 1,875`, plus one initial factory-throw execution. Commands include values, closing next, closing complete, child attach and child detach. Endings include source completion, source failure, closing failure, cancellation and a replacement factory throw. Retained old/current handles are observed after shutdown, and remaining child connections are explicitly closed.

The adapter executes RxJS first. Actual subscriber liveness determines which external commands are admitted; actual factory calls provide outcome events, and actual outer emissions name the window handles. No model state chooses the native execution. Only afterwards does the adapter replay the recorded input history through the model and compare every ordered action with its time. Some command schedules collapse to the same history, so **1,876 is an execution count**, not a distinct-history count or exhaustive-equivalence claim.

### Three generated histories of one profile

| Stem | Story |
|---|---|
| `windowWhen` | Source values across a closing next, then ordinary completion and observation of an old handle. |
| `windowWhen-complete` | Empty closing completion rotates; later source values reach the successor window. |
| `windowWhen-cancel` | Outer cancellation leaves the current child open; late attachment and independent child cleanup follow. |

Each history supplies the eight standard projections. The three histories share one export-level inspection index, producing **25 generated files** for this operator.

## Scope and limits

The canonical profile admits only non-notifying source/closing acquisition, valid Observable factory results, explicit synchronous factory outcomes, non-reentrant reactions and child attachment between completed reactions. Source values and errors remain opaque and retain identity. No scheduler, implicit outer sharing or replay is added.

Native tests separately characterize synchronous source delivery to a child attached inside the initial announcement, Observable-facade exposure, and one finite synchronous empty-closing rotation followed by `NEVER`. Those observations do not enlarge the canonical profile to synchronous closing recursion. Repeated immediate empty signals can recurse indefinitely and are not exercised as an unbounded test.

Arbitrary observer/factory reentrancy, setup-time notifications, non-Observable input conversion, imperative Subject mutation, throwing teardowns, overflowing identities and universal infinite-trace liveness are outside this profile. A release action records connection teardown; it does not prove that every external producer side effect stops.
