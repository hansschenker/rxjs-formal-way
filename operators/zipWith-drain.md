# zipWith: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Pair values by arrival index using one FIFO per input; retain completed input queues until exhausted.

**Scope:** One to sixteen total Observable inputs including source, tuple output, FIFO analysis bound 1..32 per input. The bound limits modeled histories; RxJS itself does not enforce it.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `zipWith : (U₁*, …, Uₙ*) → T* → (T × U₁ × … × Uₙ)*`. Input zero is the upstream source; remaining inputs are supplied as rest Observable arguments. Output tuple k contains value k from each input; every admitted value contributes to at most one tuple. The result completes when a completed input has no remaining queued value, including immediately after the last tuple. With zero auxiliaries, each upstream value becomes a singleton tuple; no identity shortcut is assumed.

<!-- S23-ZIPWITH-START -->
Pipeable zip and zipWith acquire the upstream source first. No producer runs during model construction.

<!-- S23-ZIPWITH-BUFFER -->
Fast arrivals are retained in order. There is no latest-value replacement, source throttling or implicit backpressure.

<!-- S23-ZIPWITH-EMIT -->
Any input can trigger a tuple. Exactly one tuple is emitted per admitted arrival because a stable state has an empty FIFO.

<!-- S23-ZIPWITH-EMIT-LAST -->
A completed input can contribute its queued values, but no tuple is possible after its final queued value is consumed.

<!-- S23-ZIPWITH-COMPLETE-BUFFERED -->
Completion stops future arrivals, not already buffered contributions. Other inputs may still drain the retained values.

<!-- S23-ZIPWITH-COMPLETE-EMPTY -->
Once one completed input has no remaining value, no future complete tuple can be formed.

<!-- S23-ZIPWITH-ERROR -->
Any input error terminates the combined result immediately.

<!-- S23-ZIPWITH-CANCEL -->
Closing the result connection is silent cancellation, not successful completion.

**Time:** Source and auxiliary notifications supply time; the operator introduces no clock or scheduler. Equal-time arrivals retain explicit event order.

**Sharing:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Callbacks:** No user projector in the canonical profile. Payloads remain opaque and retain identity inside fresh output tuples.

**Excluded:** Synchronous acquisition-time notifications, arbitrary ObservableInput conversions and unbounded FIFO histories. Optional legacy zip projector and array-argument overload behavior; these are separately characterized natively. Unsafe count overflow and more than sixteen inputs. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-23-ZIP-WITH.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-23.md) is reported separately from this specification.
