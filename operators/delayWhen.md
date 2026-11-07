# delayWhen: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Hold each source value until its own selected duration emits a next; allow overlapping waits.

**Scope:** Observable-valued duration selector; no deprecated subscriptionDelay overload.. Atomic non-reentrant notifications and selector resolution; no callback-driven source reentry.

**Dataflow shape:** `delayWhen : T* -> T* (time-shifted subset for delayWhen)`. One inner per source value, independent concurrency and retained payload identity. Only a timer firing/duration next emits a value; empty selected duration discards it. Outer completion waits for admitted inner work; error/cancellation discard.

<!-- DELAYWHEN-INIT -->
Each result subscription owns a new source and pending-duration registry.

<!-- DELAYWHEN-SOURCE-NEXT -->
delay uses one timer per source value, not a single shared debounce timer.

<!-- DELAYWHEN-SOURCE-SELECT -->
delayWhen allows multiple independently pending durations; no replacement policy.

<!-- DELAYWHEN-SELECTOR-RETURN -->
One successful selector return starts one independent duration subscription.

<!-- DELAYWHEN-SELECTOR-THROW -->
A selector failure aborts all outstanding delayed values.

<!-- DELAYWHEN-TIMER-FIRE -->
Time is supplied by scheduler event; each timer releases only its own source value.

<!-- DELAYWHEN-TIMER-FINAL -->
Last pending timer completion finishes an already-completed source.

<!-- DELAYWHEN-DURATION-NEXT-Active -->
Duration next releases its bound source payload, regardless of selector output.

<!-- DELAYWHEN-DURATION-NEXT-Closed -->
Duration next releases its bound source payload, regardless of selector output.

<!-- DELAYWHEN-DURATION-EMPTY-Active -->
An empty duration completes without releasing the source payload.

<!-- DELAYWHEN-DURATION-EMPTY-Closed -->
An empty duration completes without releasing the source payload.

<!-- DELAYWHEN-DURATION-ERROR -->
Any duration error fails the output immediately and discards other pending values.

<!-- DELAYWHEN-SOURCE-COMPLETE-WAIT -->
An outer completion cannot force early delivery: all admitted durations must settle.

<!-- DELAYWHEN-SOURCE-COMPLETE-EMPTY -->
An outer completion cannot force early delivery: all admitted durations must settle.

<!-- DELAYWHEN-SOURCE-ERROR -->
A source error never waits for delayed values or flushes them.

<!-- DELAYWHEN-CANCEL -->
Cancellation is silent and never causes a duration to fire.

**Time:** Schedulers and duration sources own time; the model only uses supplied now and ordered events.

**Sharing:** No implicit sharing or replay; multiple independent live timers/durations.

**Callbacks:** Indexed selector invoked once per source next; modeled as correlated return/throw outcomes.

**Excluded:** Promise/iterable input conversion, Date absolute delay, custom schedulers, deprecated subscriptionDelay. Reentrant producer/observer/finalizer, cancellation during callback delivery, universal metric-time guarantee.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-10.md) is reported separately from this specification.
