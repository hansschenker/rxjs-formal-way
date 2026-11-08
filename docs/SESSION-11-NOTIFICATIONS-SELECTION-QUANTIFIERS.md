# Session 11 — Notifications, indexed selection, suffixes, quantification and exhaust alias

**8 November 2026 · Europe/Zurich · pinned RxJS 7.8.2**

Exactly five previously pending distinct exports: **dematerialize, elementAt, endWith, every, exhaust**. Baseline: 50 earlier accepted names. This work is operator characterization, not an alternative implementation of RxJS.

## Intuition → Specification → Verification

The core machine decides how incoming source values and lifecycle events flow through time without interpreting domain payloads. For every operator, the Mealy six-tuple is **M = (S, S₀, Z, A, T, G)**: typed state space S; disconnected initial state S₀; input event alphabet Z; output/resource action alphabet A; transition T; ordered action policy G. Control labels are projections of S, not Z. Each named guarded rule represents one legal (state,event) → (nextState,orderedActions) reaction. Illegal or ambiguously enabled transitions throw.

| Export | Cω-style shape | State transition / action policy |
|---|---|---|
| **dematerialize** | Notification<T>* → T* | Unsubscribed → Active → Closed; N forwards embedded payload, E errors, C completes. An embedded E/C terminates immediately; source complete/error is forwarded if not already closed. |
| **elementAt(index,default?)** | T* → (T ∪ D)? | Counter starts at zero; skip while position differs, emit target and complete immediately. At short source completion emit supplied default (even undefined), or a named ArgumentOutOfRangeError if no default exists. |
| **endWith(suffix*)** | T* → (T ∪ P)* | Unsubscribed → Active → Suffix(index) → Closed. Source values first; only source completion initiates synchronous ordered suffix microsteps. Source errors and cancellation never append suffix. |
| **every(predicate)** | T* → Boolean! on successful decision | Active(index) → Calling(index,value) for each source next; correlated truthy callback advances without output, first falsy emits false and completes early; normal completion emits true including empty input (vacuous truth). |
| **exhaust** | (T*)* → T* | Deprecated *exact* alias of exhaustAll in RxJS 7.8.2. Reuses the existing reviewed exhaustAll identity-source flattening Mealy model, with separate export identity and provenance; only one inner active, busy arrivals ignored. |

## Policy dimensions and lifecycle

- **Value**: Opaque payload identity retained. Only dematerialize interprets the notification protocol tag; every interprets external truthiness (not the domain payload in the pure model).
- **Cardinality**: dematerialize passes N; elementAt selects at most one; endWith appends a finite suffix on success; every emits one boolean on finite success or first false; exhaust flattens accepted inner streams.
- **Time**: No new clocks. Notification order and scheduler/source time originate outside the models. Synchronous endWith suffix and every callback outcomes are explicit logical microsteps, not independent timers.
- **Concurrency**: exhaust accepts one inner and ignores busy outer arrivals. Every allows only one pending callback, which must return/throw before another source event.
- **Cancellation**: Unsubscribe is silent; it never means completion. No suffix, default or boolean is emitted merely because cancellation occurred.
- **Termination**: Embedded notifications terminate dematerialize; hit terminates elementAt; successful source completion begins endWith suffix; first false terminates every; exhaust waits for its accepted inner after outer completion.
- **Sharing**: None of these operators creates multicasting. State and resources remain execution-local, even if upstream is shared elsewhere in the pipeline.

## Version-pinned source inspection

Revision: **e5351d02e225e275ac0e497c7b66eaa5f0c88791**. The original implementation definitions were inspected:
- [dematerialize](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/dematerialize.ts) calls observeNotification over input values;
- [elementAt](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/elementAt.ts) composes index filter, take(1), defaultIfEmpty or throwIfEmpty;
- [endWith](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/endWith.ts) composes concat(source, of(...values));
- [every](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/every.ts) invokes predicate(value,index,source) and short-circuits on falsy;
- [exhaust](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/exhaust.ts) declares the exact export alias exhaust = exhaustAll; [exhaustAll](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/exhaustAll.ts) lowers to exhaustMap(identity).

## Explicit modeling boundaries

The model event alphabet is state-dependent. A model in Closed rejects all subsequent notifications. For every, callback.return or callback.throw must match the pending predicate invocation index and resource identity. For exhaust, identity callback.return is the reviewed flattening model's internal lowering step, not a real user callback. For endWith, suffix.next and suffix.complete are synchronous model microsteps; they do not imply additional source subscription or scheduler creation.

The elementAt missing-error model uses a **named ArgumentOutOfRangeError abstraction**, rather than claiming its error object is physically identical to the runtime error; native RxJS tests separately inspect the actual class. Excluded: arbitrary source/observer reentrancy, throwing observers/finalizers, nested cancellation during callback delivery, malformed notifications, numeric index cases beyond nonnegative safe integers, scheduled endWith overload, deprecated every(thisArg), and unrestricted ObservableInput conversion for exhaust.

## Generated proof-obligation representations

The canonical typed TypeScript rule sets generate eight deterministic views per export: JSON manifest, BDD, STT, Mermaid state diagram, test obligations, JSON model-predicted trace, four-lane model-predicted Markdown trace, and readable operator page. **Predicted traces are not native recordings.** Independent native runtime comparisons, strict TypeScript boundary checks, and read-only committed-file drift verification are separate acceptance obligations. See [Session 11 evidence](../evidence/SESSION-11.md) for CI execution results; a finite suite cannot imply universal behavioral equivalence.
