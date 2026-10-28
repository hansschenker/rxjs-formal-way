# Review: RxJS Operators as Mealy Machines

**Review date:** 28 October 2026. **Target:** RxJS 7.8.2, not an assertion about the latest release.

## Provenance and publication boundary

Hans Schenker supplied `Gemini-RxJS Operators as Mealy Machines-20261028-0623.md`, exported on 28 October 2026. The transcript attributes its responses to Gemini. We credit that document for the inspiration below without treating model identity or generated prose as technical evidence.

SHA-256 of the supplied file:

```text
c20575ef506592edf8632a40519ccbf85344b6a2677e7f505a3e19ff2732ce4c
```

This repository stores an attributed review, not the full conversation or its private session URL. Existing repository baseline reviewed: `e33c1a3102abbbc9c96d21179c0e202337807772`.

## What we adopt

| Idea from the transcript | Decision for rxjs-formal-way |
|---|---|
| Pure transition kernel separated from the subscription interpreter | Adopt as architecture, with an explicit execution contract and independent interpreter tests |
| Cascade composition over a product state | Adopt for a declared pure, deterministic finite-word scope; add the reverse cancellation path for RxJS |
| Explicit feedback ports | Adopt for modeling resubscription and recursive expansion; keep their distinct policies |
| Subscriber-addressed output and a subscriber registry | Adopt for shared machines; also model connection generations and reset ownership |
| Interactive state/trace views | Retain as a simulator design, not as shipped UI; use one trace to drive all views |
| Operator-family summaries | Use as teaching projections, not a substitute for overload/configuration-specific analyses |

The new [composition and ownership guide](../COMPOSITION-AND-OWNERSHIP.md) develops these decisions. The existing six methods remain: Cω-style notation, dependent types, Mealy models, BDD, four-lane traces, and test cases.

## What must be corrected or qualified

| ID | Transcript claim or implementation | Correction / limitation | Evidence obligations |
|---|---|---|---|
| D01 | Saturated `expand` emits now and queues only projection | RxJS buffers the value before downstream emission; admission gates both emission and projection | EXP-01, EXP-02, EXP-05 |
| D02 | A FIFO feedback interpreter faithfully handles synchronous expansion | Dispatch order is observable; synchronous unbounded recursion and concurrency-one buffering can differ | EXP-04, SUB-03 |
| D03 | `retry(k)` and `repeat(k)` share one count convention | Numeric retry counts additional attempts; numeric repeat counts total subscriptions | RET-01, RET-02, REP-01, REP-02 |
| D04 | Resetting the upstream model state implements retry | A new subscription must actually invoke the producer and recreate subscription-local state | RET-03 |
| D05 | State before `share()` necessarily remains outside the retry reset | Default share resets on error, so retry can recreate upstream state; configuration matters | SHR-01, SHR-02 |
| D06 | Plain Subject is ReplaySubject with capacity zero | That can be a conceptual mode, not a literal RxJS constructor equivalence: capacity is clamped to one | SUB-01 |
| D07 | A completed replay buffer is frozen | Count-only scope is needed; finite windowTime still expires entries on later subscription | SUB-02 |
| D08 | The general notification wrapper implements arbitrary operators | It lacks initialization, timer/inner inputs, shared ownership, and a sufficiently specified lifecycle driver | TAK-01, TAK-02, MAP-01; additional driver tests required |
| D09 | map/filter need no state beyond Active/Stopped | Value-only teaching profiles may omit indices; full callback signatures expose per-subscription indices | MAP-02, CAS-02 |
| D10 | Pure-step tests establish every asynchronous edge case or bisimilarity | They check the model. Timed, lifecycle and reentrancy observations require separate runtime evidence; tests are not universal proofs | CAS-01, EXP-03, SR-01..04, SUB-03 |
| D11 | A fixed feedback iteration limit detects an infinite loop | It establishes budget exhaustion only; a longer finite run is also possible | Design requirement, not an executed divergence test |
| D12 | The displayed plain notification objects have type Notification<T> | Use ObservableNotification<T> or a custom discriminated union; Notification<T> is a class with methods | Source inspection; no TypeScript build claimed |

## Why the supplied wrappers are not imported as production code

The notification-only wrapper returns its upstream subscription only after `source.subscribe(...)` finishes. Synchronous source execution can therefore precede attaching that returned teardown to the downstream subscription. Checking `subscriber.closed` only while delivering outputs is insufficient to prove that producer work stops promptly.

Its plain observer callbacks also do not establish the operator-specific error-forwarding behavior required for exceptions thrown by the step. The initial state is a shared value rather than a fresh-state factory: mutation of an object seed could leak between subscriptions. The `takeMealy(0)` example ignores all notifications instead of completing at initialization without subscribing.

The `expand` driver introduces a FIFO event queue, which is a substantive dispatch policy. It also needs robust cleanup if projection throws, identity checks for stale inner events, correct synchronous completion bookkeeping and cancellation wiring before synchronous work starts. These are design obligations, not cosmetic refactoring.

The shareReplay sketch is valuable for the count-only model. It omits timestamp expiry, connection generations, delivery snapshots/reentry and several parameter boundaries. In particular, JavaScript `.slice(-0)` keeps the entire array; it does not implement a zero-capacity buffer. RxJS itself clamps capacity to at least one.

## Formal claims we retain only with assumptions

Cascade folding of finite output words is useful and admits a direct associativity argument under pure deterministic semantics. That does not justify arbitrary RxJS operator fusion. Observable behavior includes callback indices, error paths, subscription lifetime, side effects, scheduling and reentry, not just output values.

Feedback is a useful modeling mechanism. Calling it a categorical trace requires a defined category, tensor, equivalence relation, treatment of nontermination and checked trace laws. The transcript does not supply that construction; the project does not claim it.

Likewise, a state-indexed dependent type specifies which transitions are legal in the model. It does not by itself prove that RxJS or a TypeScript interpreter implements those transitions. Keep model legality, interpreter correctness, and runtime conformance separate.

## Primary source checks

All implementation references below are pinned to the RxJS 7.8.2 tag:

- [mergeInternals.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/mergeInternals.ts): admission, expansion emission, inner completion/finalization, queue draining.
- [expand.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/expand.ts): public configuration and delegation.
- [retry.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/retry.ts) and [repeat.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/repeat.ts): counts and actual resubscription.
- [share.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/share.ts): reset policies, connection ownership, synchronous cancellation wiring.
- [shareReplay.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/shareReplay.ts): resetOnError=true, resetOnComplete=false, resetOnRefCountZero=refCount.
- [ReplaySubject.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/ReplaySubject.ts): capacity normalization, timestamp trimming and replay.
- [Subject.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/Subject.ts): observer delivery and lifecycle.
- [take.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/take.ts): initialization and synchronous boundary.
- [map.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/map.ts) and [filter.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/filter.ts): callback indices.
- [Notification.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/Notification.ts), [Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/Subscriber.ts), and [Observable.ts](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/Observable.ts): notification objects and subscription boundaries.

## Evidence and next step

See [the validation record](../../evidence/2026-10-28-insights.md) and [the characterization suite](../../tests/insights.test.mjs). Test names carry the obligation IDs used above. Literal expected outcomes were written independently of a generated reference model.

The next step is still M01, not automatic migration of every operator: incorporate ownership, initialization, action ordering and dispatch scope into the canonical schema, then migrate one reference operator end to end.
