# Session 4 — Memory, equality, membership, adjacent pairs, and prefix injection

## Source pin and the five distinct exports

This session covers the next five pending **RxJS 7.8.2** exports, not aliases or additional export names:

1. `distinctUntilChanged`
2. `distinctUntilKeyChanged`
3. `distinct`
4. `pairwise`
5. `startWith`

Reference revision: [RxJS 7.8.2 `e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791).

Pinned implementations and comparisons:

| Export | Implementation | Distinguishing observation |
|---|---|---|
| distinctUntilChanged | [source](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/distinctUntilChanged.ts) | First value always emitted after key selection; compare to **last emitted key**, not last received value; default comparator is strict `===` |
| distinctUntilKeyChanged | [source](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/distinctUntilKeyChanged.ts) | Delegates to `distinctUntilChanged` using a comparator on `previous[property]` and `current[property]` |
| distinct | [source](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/distinct.ts) | Historical **Set** of all keys since the last flush; optional selector and independent flush notifier |
| pairwise | [source](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/pairwise.ts) | Memorize one source value; start emitting pairs only at the second next |
| startWith | [source](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/startWith.ts) | Prefix values are synchronously emitted **before** subscribing to source in the unscheduled overload |

Operator behavior is the movement of *opaque values across time*. No model executes a user's selector or comparator inside its guarded rules; user function outcomes are external events. Time comes from source/notifier delivery and explicit trace timestamps, not from these five operators.

## The compact semantic comparison

| Operator | Cω-style value shape | Remembered state | Action when new value arrives |
|---|---|---|---|
| distinctUntilChanged | `T* → T*` | Key of last **emitted** item | Select key; if first, emit; otherwise compare with saved key, suppress equal, emit and update on change |
| distinctUntilKeyChanged | `T* → T*` | Previous **emitted** item's specified property value | Apply same adjacent-key policy; in RxJS the comparator accesses properties from the stored item |
| distinct | `T* × Flush*? → T*` | Set of all seen keys | Select key if configured; forward only if new under SameValueZero; flush-next clears Set |
| pairwise | `T* → (T × T)*` | Last source value, with a separate presence bit | First value remembers only; later values emit [previous,current] and update memory |
| startWith | `startWith(P*) : T* → (P + T)*` | Prefix cursor until source connection | Emit all supplied prefix values synchronously, connect to source, then forward source values |

These signatures describe value cardinality, not terminal, resource, or callback actions. `Flush*?` and `P*` are project-level Cω-inspired notation; not a claim of original Cω notation.

### Equality is not one universal relation

The default `distinctUntilChanged` uses **strict equality**, while `distinct` uses a JavaScript **Set** and **SameValueZero**. Accordingly:

- `NaN === NaN` is false: adjacent `NaN` values can both pass through default `distinctUntilChanged`.
- Set membership treats all `NaN` keys as the same: only the first passes `distinct` until cleared.
- Both relations consider `0` and `-0` equal; neither clones or deep-compares objects.
- `distinctUntilKeyChanged` defaults to property `===` and compares with the preceding *emitted* object; a custom comparator can override this.
- Keyed distinctness outputs the original value, **not the selected key**.

For the exact reference model, `distinctUntilKeyChanged` is scoped to plain, stable property values without mutation or getter side effects between comparisons. RxJS itself reads `x[key]` and `y[key]` inside the comparator, so mutating a previously emitted object can have consequences beyond that snapshot-key profile. This difference is stated rather than hidden.

## Canonical six-tuple and state-indexed legal behavior

Every model uses the extended Mealy tuple `M = (S, S₀, Z, A, T, G)`:

- `S` is the state (including remembered values, subscription and callback-generation identity).
- `S₀` is the fresh unsubscribed state.
- `Z` is the alphabet of legal input events.
- `A` is the alphabet of ordered notifications, resource acquisitions/releases, and symbolic synchronous callback requests where applicable.
- `T : S × Z → S` computes the next state.
- `G : S × Z → A*` supplies an ordered action word, from the **same transition**.

| Model | S | Z | Essential state-dependent constraints |
|---|---|---|---|
| Adjacent selection (two exports) | Unsubscribed, Active (index, optional last-emitted key), Selecting (input, call identity), Comparing (previous/current keys), Closed | subscribe; source N/C/E; key return/throw; compare return/throw; cancel | The key returned must identify the **pending** selection; comparison must identify the **pending** comparison. A first key always emits, compare only after first emission, stale/foreign outcomes are illegal, and no input may enter after closure |
| Distinct | Unsubscribed, Active (Set, index, optional flush subscription), Selecting, Closed | subscribe; source N/C/E; selector return/throw; flush N/C/E; cancel | A key result must match the pending invocation; stored Set keys must be unique under SameValueZero. Flush events require a live flush subscription; notifier completion does **not** complete result or clear memory; notifier error **does** terminate |
| Pairwise | Unsubscribed, Active (hasPrevious, previous payload), Closed | subscribe; source N/C/E; cancel | `hasPrevious` cannot be inferred from value truthiness or `undefined`. The first input cannot emit a pair; subsequent outputs each contain the retained previous value and current value |
| StartWith | Unsubscribed, Prefix (index), Active, Closed | subscribe; prefix.next; prefix.complete; source N/C/E; cancel | Source events are illegal before prefix completion. Exactly one configured prefix item is emitted at a time in index order. Source is subscribed to only after all prefixes, unless no prefix exists; cancellation during prefix prevents source acquisition |

### Correlated key and comparator microsteps

The adjacent models use `source.next → key.return → [compare.return]` at the same input time point. There is a distinct guarded rule for first-key forwarding, equality suppression, changed-key forwarding and key/comparison failure. The model's `invoke-callback` actions are **requests**, not calls executed by the transition interpreter.

For default `distinctUntilChanged()`, the key step is a **synthetic identity evaluation** and comparison uses strict equality. No physical user callback is called. For `distinctUntilKeyChanged('code')`, the key step is a **synthetic stable-property projection**, not a user-supplied key selector. The implementation's actual comparator receives previous and current *whole objects* and accesses their keys. For custom comparators, model-generated requests have correlating invocation IDs and the independent runtime driver records actual comparator calls.

`distinct` without a selector has direct pass/drop transitions. With a selector, it has explicit request/return/throw phases and remembers the *selected key* in the Set. This avoids claiming that a user function is invoked in the default identity profile.

### Ordered actions versus resource reality

Each model creates a fresh execution on subscription and owns its state locally. Even if the original source is hot, nothing here automatically introduces sharing. Resource references are tracked as `source#0` and optionally `flush#0`; callback invocations use per-execution index generations.

The reference models describe subscription lifetime, notifications, and teardown at non-reentrant quiescent boundaries. Downstream cancellation is **not** source completion and never sends a synthetic completion. For `startWith`, cancellation during prefix delivery is a separate legal transition and prevents source subscription. Model-predicted traces and actual RxJS observations are **different evidence streams**.

## Distinct flux/flush lifecycle

The real `distinct(keySelector?, flushes?)` registers a source subscription and then, if configured, a notifier through `innerFrom(flushes)`. Each notifier `next` clears the Set. The notifier's **completion** is intentionally ignored as an output terminal; it closes its own subscription but does not clear the Set. An **error** from the notifier is forwarded downstream and tears down the source.

A flush event tied with source next at the same timestamp is ordered by actual delivery sequence: *flush then source* can admit a repeated key; *source then flush* may suppress that value before the reset. This is scheduling/order, not a clock invented by `distinct`.

The exact reference profile uses a supplied Observable notifier, post-setup external delivery and no arbitrary producer reentry. The broader `ObservableInput` conversion protocol and synchronous source termination during notifier wiring are separately out of scope.

## Pairwise is overlapping, not buffering in disjoint groups

For input `a,b,c`, `pairwise` yields `[a,b],[b,c]`, rather than `[a,b]` followed by an incomplete `[c]`. For an empty or single-value source the result emits no next notification before completion. Pair arrays are new objects that retain the **same references** to original values; no business transformation or deep clone occurs.

The previous value is stored **before** emitting each pair, a crucial state transition when analyzing more complex nested delivery. The exact model does not claim full arbitrary reentrant observer semantics.

## StartWith is a subscription boundary

With unscheduled `startWith(a,b)`, subscription proceeds as:

```text
subscribe downstream
    |
    +-- next(a)   [prefix, source not yet connected]
    +-- next(b)   [prefix, source not yet connected]
    +-- subscribe source
          |
          +-- source next -> downstream next
          +-- source complete/error -> downstream terminal
```

The explicit `prefix.next` and `prefix.complete` events in the model are logical **synchronous phases**, not extra source notifications, timers, or a request to implement `startWith` using an asynchronous queue. The prefix is repeated separately for each subscriber. `startWith()` with no values connects to the source immediately. A cancelled prefix does not subscribe to the source at all; the actual RxJS test `startWith(...).pipe(take(1))` checks that guarantee with a cooperative source.

**Excluded overload:** RxJS 7.8.2 still accepts the deprecated `SchedulerLike` argument. That path uses scheduled concatenation and can change the timing of prefix and source subscription. It is outside the unscheduled `startWith` reference profile and must not be asserted to have identical behavior.

## Generated artifacts and evidence

For each of the five *export names*, `scripts/generate.mjs` derives eight projections directly from the canonical model:

- JSON manifest (including source pin, scope, rule IDs, and action alphabet)
- BDD descriptions and state-transition table
- State diagram and test-obligation document
- JSON example trace and four-lane Markdown trace
- Plain-language operator page

Multiple tested options or overload profiles remain **one export name**, never extra operator counts. The generated examples are intentionally literal, independently interpreted model paths; their output alone is **not** evidence of actual RxJS conformance.

Independent tests compare callback outcomes, emitted values and exact event sequence, per-resource subscription acquisition and release times, equal-time order and early termination. Both model and native tests include negative scenarios. Finite bounded differential enumeration is evidence within declared scopes, **not** an exhaustive equivalence proof.

See [Session 4 evidence](../evidence/SESSION-04.md) for the actual tested SHA, CI runs, correction history, selected scopes and remaining gaps. A status is not accepted merely because these paragraphs and generated files exist.
