# Session 2 — Higher-order value flow (M02-D and companion policies)

**Pinned subject:** RxJS 7.8.2, revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.
**Canonical declaration:** [src/models/flatten.ts](../src/models/flatten.ts).
**Execution result:** [Session 2 evidence](../evidence/SESSION-02.md), not this specification.

This session resumes the already-started 29 October 2026 Europe/Zurich log. It does not open a second daily batch. The only selected export names are switchMap, mergeMap, concatMap, exhaustMap and share. The [share guide](M02-E-SHARE.md) covers the fifth name.

## Intuition: the machine moves values; the supplied function defines the inner source

Outer values arrive over time. The operator decides whether and when to admit each value. An admitted value goes to the supplied projection, which returns a description of an inner source. Subscribing to that source starts this inner subscription. Inner values, not the original outer value, flow downstream.

| Operator | On a new outer value while busy | What must be remembered |
|---|---|---|
| switchMap | Unsubscribe the current inner, then project the new value | Current inner identity, projection index, outer-completion status |
| mergeMap | Admit while below the limit; otherwise queue the raw value | Active inner identities, concurrency limit, FIFO, projection index, outer-completion status |
| concatMap | Queue until the current inner completes | One inner identity, FIFO, projection index, outer-completion status |
| exhaustMap | Ignore the arrival; do not project or queue it | Current inner identity, accepted-projection index, outer-completion status |

These are admission/cancellation policies, not business rules. No model evaluates a user's function in a guard. The same returned source can be subscribed multiple times under different subscription generations.

The pinned concatMap implementation delegates to mergeMap with concurrency one. Accordingly the two specifications reuse queue machinery, but have separate model identities, rule IDs, generated pages and native tests. Switch and exhaust retain their different admission rules and their different final-completion ordering from the merge family.

## Scope and configuration

The projected binding represents a valid RxJS Observable. A return event carries an opaque source token; the test environment resolves that token to a concrete producer. Conversion of arbitrary ObservableInput values, deprecated resultSelector overloads, and invalid projection results are outside this profile.

Projection is synchronous but explicit: `outer.next -> invoke-callback -> callback.return/throw`. Resolve that outcome before any other external event. Source, projection, observer and finalizer reentry is excluded; it is not silently queued. Exact action/teardown comparisons use source and inner notifications delivered after their subscription setup returns. Separate native tests characterize synchronous inner values, synchronous completion and downstream take cancellation without claiming identical internal finalizer ordering for every synchronous source.

mergeMap accepts positive safe-integer concurrency or Infinity. The serializable parameter uses `unbounded` for Infinity. The generated mergeMap example uses concurrency **2**, so both overlap and queueing are visible. Tests also cover concurrency **1** and the unbounded default. concatMap fixes the limit at one; switchMap and exhaustMap permit at most one current inner. Index exhaustion is an explicit model-domain limit, not a claim that RxJS throws on sufficiently long streams.

## Cω-inspired shape

```text
project   : T! × Index! -> R*
switchMap : project -> T* -> R*
mergeMap  : project -> T* -> R*     (concurrency is a fixed parameter)
concatMap : project -> T* -> R*
exhaustMap: project -> T* -> R*
```

The identical stream shape is intentional: it does not distinguish their policies. A projected inner can be empty, finite or nonterminating. Successful invocation does not guarantee one output. Errors, cancellation, admission, completion waiting and ordering live in the behavioral model, not in an unqualified cardinality slogan.

## Six-tuple, instantiated for each operator

`M = (S, S0, Z, A, T, G)`, with `T : S × Z -> S` and `G : S × Z -> A*`.

| Component | switchMap | mergeMap | concatMap | exhaustMap |
|---|---|---|---|---|
| S | One current inner or none; index; outer status; pending projection | Ordered active set; FIFO; index; outer status; pending projection | Same as merge, with at most one occupied slot | One current inner or none; accepted index; outer status; pending projection |
| S0 | Unsubscribed | Unsubscribed | Unsubscribed | Unsubscribed |
| Z | Subscription/cancel; outer next/error/complete; correlated projection outcome; generation-qualified inner next/error/complete | Same tagged alphabets | Same tagged alphabets | Same tagged alphabets |
| A | Outer/inner acquire-release; invoke projection; downstream notifications | Same ordered action alphabet | Same ordered action alphabet | Same ordered action alphabet |
| T | Replace active identity and advance admission index | Admit or enqueue; remove completed inner and dequeue | Admit one or enqueue; advance only when dequeued | Admit if idle; otherwise preserve state without advancing index |
| G | Release old inner before projection; forward only current inner values | Request admitted projections; forward all active inner values in delivery order | Request projections in FIFO admission order | No actions for busy arrivals; forward current inner values |

The finite control projection is Unsubscribed, Active, Calling, Draining and Closed. Stored payloads, source tokens, queues and counters make the full model symbolic and potentially unbounded. Calling contains a reserved slot and a `resume` phase. Draining means the outer has completed, not that the result has completed.

Rule counts depend on the selected configuration: switchMap 16; generated mergeMap(2) 20; concatMap 19; exhaustMap 16. Unbounded mergeMap has no queue rules because that queue cannot become nonempty within the scoped profile.

## State-dependent legal behavior

```text
Behavior : (state : S) -> (event : E state)
        -> Σ (nextState : S). Actions state event nextState
```

This is the specification discipline. TypeScript discriminated unions and runtime invariants implement some constraints; they do not provide a dependent-type proof of RxJS.

For **every** profile, Unsubscribed accepts only subscribe; Calling accepts only the matching return/throw; Closed accepts no events. Active accepts outer events. Draining rejects new outer notifications and retains only inner work/cancellation. An inner event is legal only for a currently admitted subscription generation. A stale actual producer attempt is stopped by an unsubscribed RxJS subscriber; the model does not invent a public stale-event exception API.

For **switchMap**, the active set has cardinality at most one, the queue is empty, and replacement removes the previous identity before requesting projection. A throwing replacement cannot restore the old inner.

For **mergeMap**, active subscriptions plus a reserved Calling slot never exceed the limit. At a quiescent state, a nonempty queue implies all slots are occupied. Queued values are not projected. Inner completion releases that subscription and admits the FIFO head; outer completion does not discard the queue.

For **concatMap**, the same laws hold with limit one. A noncompleting inner can retain all later inputs indefinitely; queuing is not a backpressure protocol or a memory bound.

For **exhaustMap**, the queue is always empty, busy arrivals produce no action and do not increment the index. There is no delayed replay of ignored arrivals.

## Canonical model and derived views

One shared constructor instantiates policy-specific guarded rules. It is not a replacement implementation of the RxJS operators. The external projection is represented by a named binding. A `subscribe(inner#g)` action resolves through the binding stored in the resulting active-inner registry; subscription identity and source identity are deliberately separate.

The existing schema 1.1, generic runner, renderer, old models, old tests and dependency lockfile are unchanged. Only public exports and the generation registry are extended. The full chain remains:

```text
canonical model + named guarded rules
    -> manifest -> BDD / STT / STD / obligations / prose
canonical model + concrete ordered inputs
    -> predicted JSON trace -> trace table + four lanes
independently executed RxJS cases
    -> comparison -> retrieved CI evidence
```

| Operator | Behavior | BDD | STT | STD | Obligations | Four lanes |
|---|---|---|---|---|---|---|
| switchMap | [Page](../operators/switchMap.md) | [BDD](../generated/switchMap.bdd.md) | [STT](../generated/switchMap.stt.md) | [STD](../generated/switchMap.diagram.md) | [Tests](../generated/switchMap.obligations.md) | [Trace](../generated/switchMap.trace.md) |
| mergeMap | [Page](../operators/mergeMap.md) | [BDD](../generated/mergeMap.bdd.md) | [STT](../generated/mergeMap.stt.md) | [STD](../generated/mergeMap.diagram.md) | [Tests](../generated/mergeMap.obligations.md) | [Trace](../generated/mergeMap.trace.md) |
| concatMap | [Page](../operators/concatMap.md) | [BDD](../generated/concatMap.bdd.md) | [STT](../generated/concatMap.stt.md) | [STD](../generated/concatMap.diagram.md) | [Tests](../generated/concatMap.obligations.md) | [Trace](../generated/concatMap.trace.md) |
| exhaustMap | [Page](../operators/exhaustMap.md) | [BDD](../generated/exhaustMap.bdd.md) | [STT](../generated/exhaustMap.stt.md) | [STD](../generated/exhaustMap.diagram.md) | [Tests](../generated/exhaustMap.obligations.md) | [Trace](../generated/exhaustMap.trace.md) |

Each also has `generated/<name>.manifest.json` and `generated/<name>.trace.json`. The latter is model-predicted, not a recording of RxJS. Manifest annotations are authored beside executable rules; generation prevents document drift but does not prove English equivalent to code.

## A readable rule, and why its order matters

```text
Given Active and a current inner subscription
When another outer value arrives
Then unsubscribe the current inner
Then request the new projection
And Calling with the old inner removed and the next index remembered
```

That is SWITCHMAP-REPLACE. Its native witness checks that release appears in the observation log **before** the new projection call. Checking only output marbles would miss this distinction. The diagram edge, STT row, BDD scenario and obligations carry the same ID.

In the switchMap example, a is projected at time 1, a1 flows at time 2, b replaces it at time 3, and the outer completes at time 4. b1 still flows at time 5; the result completes only when b's inner completes at time 6. Time is supplied by those sources, not by switchMap.

## Termination and ownership

Outer completion releases the outer but waits for admitted inners and any queue. Any outer/inner/projection error terminates the whole result and discards queued work. Downstream cancellation releases owned subscriptions without a terminal notification. Unsubscribing a shared inner detaches this subscriber; it does not imply cancellation of a producer still used elsewhere, nor does it roll back side effects.

For the post-setup profile, switchMap/exhaustMap emit final completion before final-inner teardown; mergeMap/concatMap release that inner in finalization before completing or admitting queued work. These order assertions are tested explicitly and are not generalized to arbitrary synchronous initialization or throwing teardown.

All four operators keep state per result subscription. A hot outer does not itself share their counters, queues or inner subscriptions. No timer or scheduler is added by these models.

## Verification and evidence boundary

The 62 pure-model tests check literal reactions, identities, throwing outcomes, counter boundaries, corruption detection and legal reachability for each instantiated rule (including merge concurrency 1, 2 and unbounded). Runtime cases additionally check synchronous behavior, stale producer attempts, projection timing, hot-input independence and cancellation.

The main differential experiment has **8,100** scenarios:

```text
6 operator/configuration profiles × 5 projection/inner plans
× 15 binary words (length 0..3) × 3 spacings
× 3 outer endings × 2 ending offsets = 8100
```

The model path uses an independent finite event queue. The native path uses real RxJS operators and TestScheduler, with no model imported into that observer. Both record calls, notifications, times, and outer/inner acquisition-release in order. A deliberate final cancellation bounds never-ending fixtures. No count represents a universal proof or exhaustive testing of all user functions.

Run `npm run check`; consult the evidence record for actual execution and the exact tested revision. Session 2 stops after its five reserved names; the next queue comes from the planning JSON.

## Pinned primary sources

- [switchMap](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/switchMap.ts)
- [mergeMap](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeMap.ts)
- [mergeInternals](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeInternals.ts)
- [concatMap](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/concatMap.ts)
- [exhaustMap](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/exhaustMap.ts)

The imported Mealy-machine discussion remains conceptual provenance in the earlier review. This implementation is a source-checked refinement, not adoption of its universal wrappers or FIFO reentrancy claims.
