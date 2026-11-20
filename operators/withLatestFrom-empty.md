# withLatestFrom: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use latest auxiliary values only at source emission time, gated by all auxiliaries having produced a value.

**Scope:** One to sixteen valid Observable auxiliaries; tuple output without optional result-selector projection.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `withLatestFrom : (U₀*,…,Uₙ*) → T* → (T × U₀ × … × Uₙ)*`. An output can occur only on source.next after every auxiliary has produced at least one next. Auxiliary next updates latest memory but never emits downstream; unready source values are dropped. Auxiliary completion retains last value and never terminates outer; source complete/error terminates regardless of readiness.

<!-- S22-WITHLATESTFROM-START -->
Auxiliary subscriptions precede source subscription even though only source next can trigger output.

<!-- S22-WITHLATESTFROM-AUX-NEXT -->
Undefined is a valid present value. An auxiliary next never emits an output tuple.

<!-- S22-WITHLATESTFROM-AUX-COMPLETE -->
Auxiliary completion is not output completion. Its last value remains usable on future source next events.

<!-- S22-WITHLATESTFROM-AUX-ERROR -->
One auxiliary error ends the result even if readiness was never reached.

<!-- S22-WITHLATESTFROM-SOURCE-BLOCKED -->
When readiness becomes true, earlier source values are lost rather than replayed.

<!-- S22-WITHLATESTFROM-SOURCE-READY -->
The source, not auxiliary emission, determines output timing. Tuple members retain original value identity.

<!-- S22-WITHLATESTFROM-SOURCE-COMPLETE -->
Auxiliary completion is irrelevant to source completion; no pending emissions wait for input readiness.

<!-- S22-WITHLATESTFROM-SOURCE-ERROR -->
Errors propagate by identity and are never projected into a value.

<!-- S22-WITHLATESTFROM-CANCEL -->
Auxiliary subscriptions are owned by each result execution; no implicit share/replay.

**Time:** No scheduler added; source and auxiliary notifications supply time. Same-time ordering is explicit input order.

**Sharing:** Independent result subscriptions own independent latest memory and auxiliary/source connections; no sharing or replay introduced.

**Callbacks:** No user callback in this profile. Each output is a fresh array; each member is the unchanged opaque value/reference.

**Excluded:** Zero auxiliary arguments, whose pinned implementation leaves ready false indefinitely. Optional resultSelector/projector overload, throwing projector and callback reentrancy. Synchronous setup-time notifications/errors and ObservableInput conversion from Promise/Iterable. Unbounded auxiliary counts and arbitrary subscription-side effects. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-22-LATEST-GATE.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-22.md) is reported separately from this specification.
