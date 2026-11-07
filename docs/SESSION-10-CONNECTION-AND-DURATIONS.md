# Session 10 — Connection, selection, defaulting and independent durations

**7 November 2026 · Europe/Zurich.** Five reserved pending RxJS 7.8.2 pipeable exports: **connect**, **debounce**, **defaultIfEmpty**, **delay**, **delayWhen**. Each has a canonical TypeScript Mealy machine, named guarded rules, independent model/native tests, and eight projections through the existing generator. Overload profiles count under one export name.

## Formal contract and pinned source

Pinned RxJS 7.8.2 revision: [e5351d02e225e275ac0e497c7b66eaa5f0c88791](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). The Mealy six-tuple is **(S, S₀, Z, A, T, G)**: S state, S₀ initial state, **Z input event alphabet**, A ordered actions, T transition, G output/action function. Control labels are a projection of S, not the input alphabet. Callback requests are effects-as-data; callback returns/throws are correlated input events, never executed while generating text.

All profiles exclude arbitrary reentrant observer/finalizer behavior, cancellation inside callbacks, Promise/iterable conversions unless explicitly stated. Time and same-moment ordering are supplied by sources, schedulers and scenario event order. Finite comparisons are not universal proofs.

## connect — selected subscribers before one producer

**Intuition.** Two selected consumers must listen to the same stream before the possibly synchronous original producer connects. **Cω:** for this deliberately fixed selector of two merged shared branches, T* → (T + T)*; each upstream next produces exactly two downstream nexts of the identical payload. This is NOT the cardinality of arbitrary selectors.

**S:** Unsubscribed, Preparing, Active, Closed(reason). **S₀:** Unsubscribed. **Z:** subscribe, selector.return/throw, source.next/complete/error, cancel. **A:** invoke selector, subscribe selected output then source, forward two value notifications, propagate terminal, unsubscribe selected/source.

**T/G:** subscribe allocates a fresh local default Subject and invokes selector. Its successful result is subscribed **before** the source. Every source.next broadcasts unchanged to two already-connected selected branches; source completion or error finishes the selected result; cancellation releases both subscriptions without a terminal event. Selector throw fails before connecting producer.

**Ownership:** sharing only *within* one connect result subscription; new outer subscription creates a new Subject and producer subscription. **Scope:** default Subject, selected result equivalent to merging two subscriptions to the shared source, no custom connector or arbitrary selector graph; synchronous source after setup supported, synchronous early termination of selected result excluded. **Tests:** source subscribe count, dual same-identity values, synchronous setup ordering, error and cancellation.

## debounce — replace duration and latest memory

**Intuition.** Keep only the latest value; a new source value cancels the previous duration. **Cω:** T* × (T → Duration*) → T* (at most one pending value at a time). **S:** Unsubscribed, Active(nextId,pending?), Calling(nextId,pending), Closed(reason). **Z:** subscribe; source.next/complete/error; callback.return/throw; duration.next/complete/error; cancel. **A:** cancel old duration, invoke selector, subscribe returned duration, emit latest, complete/error, unsubscribe owned resources.

**T/G:** a new source.next discards the previous pending value, unsubscribes any live duration, then invokes the selector for the latest value. Only the current duration's **next** emits. Duration completion without next closes its resource but **does not emit**. Source completion flushes a still-cached latest value, even after silent duration completion. Error or cancellation discards pending output. **Time:** from selected duration Observable; no internal clock. **Sharing:** none. **Scope:** Observable duration selector; atomic callback microsteps; no Promise selector or arbitrary reentry.

## defaultIfEmpty — completion-time fallback selection

**Intuition.** Pass each source value unchanged; only a successfully completed empty source gets a fallback. **Cω:** T* → (T | R)*; exactly one R on successful empty completion. **S:** Unsubscribed, Active(hasValue:boolean), Closed(reason). **Z:** subscribe, source.next/complete/error, cancel. **A:** acquire/release source, notify next/complete/error.

**T/G:** every next sets a *presence bit*, regardless of payload truthiness. Empty successful completion emits fallback then complete; nonempty completion emits only complete. Errors and cancellations never emit fallback. A literal undefined or null is still a real next. No new timer or sharing. **Tests:** EMPTY, undefined, identity, error and early cancellation.

## delay — one independent timer per source value

**Intuition.** Shift each value to a later scheduler event without discarding its earlier peers. The pinned implementation delegates to delayWhen with timer(due,scheduler). **Cω:** T* → T* on successful finite sources with all timers firing; outputs shift in time. **S:** Unsubscribed, Active(sourceLive,nextId,items), Closed(reason). Each item has identity, payload and deadline. **Z:** subscribe, source.next(now), timer.fire(now,id), source.complete/error, cancel. **A:** schedule/cancel timer, subscribe/unsubscribe source, notify.

**T/G:** on each next, remember a new item and request a timer scheduled at now+due. Timer firing at or after the deadline releases only that item; early/stale timer firings are illegal. Source completion waits for the remaining timers; last timer settlement completes output. Error/cancellation cancels all and never flushes. **Time:** supplied externally by scheduler events, not invented by the model; zero delay is still scheduler-mediated. **Sharing:** none. **Scope:** nonnegative safe-integer relative due, no absolute Date or custom scheduler.

## delayWhen — concurrently selected independent durations

**Intuition.** Each source value opens a separate wait; they can overlap and finish out of source order. **Cω:** T* × (T × ℕ → Duration*) → T*; empty durations can reduce output cardinality. **S:** Unsubscribed, Active(sourceLive,nextId,items with Calling or Pending stage), Closed(reason). **Z:** subscribe, source.next(now), callback.return/throw, duration.next/complete/error, source.complete/error, cancel. **A:** invoke indexed selector, subscribe/unsubscribe each duration, notify original source values, release pending resources.

**T/G:** each source next invokes its selector with a zero-based index, then subscribes the returned Observable independently. The first duration next emits the **source value**, not the inner notification payload. Empty duration completion drops its value. Outer completion waits for all outstanding durations; last settlement completes downstream. Any source/inner/selector error cancels remaining work and preserves error identity; cancellation is silent. **Time:** comes from each duration source. **Sharing:** none. **Scope:** Observable selector, no deprecated subscriptionDelay overload or Promise conversion; atomic nonreentrant callback resolution.

## Verification boundary

Canonical manifests, BDD, STT, diagrams, obligations, JSON trace, four-lane trace and plain-language operator pages are produced from the same guarded models; the generated traces are *predictions*. Independent RxJS 7.8.2 runtime observations are in tests/session10-rxjs.test.mjs; pure rule checks are in tests/session10-model.test.mjs. See evidence/SESSION-10.md for exact CI outcomes and revisions. Do not treat unexecuted checks as verified or finite tests as universal behavioral equivalence.
