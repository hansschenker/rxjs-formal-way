# delay: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Delay each source value independently using a scheduled timer.

**Scope:** Relative nonnegative safe-integer due duration; virtual scheduler events. No Date or custom scheduler.. Atomic non-reentrant notifications and selector resolution; no callback-driven source reentry.

**Dataflow shape:** `delay : T* -> T* (time-shifted subset for delayWhen)`. One inner per source value, independent concurrency and retained payload identity. Only a timer firing/duration next emits a value; empty selected duration discards it. Outer completion waits for admitted inner work; error/cancellation discard.

<!-- DELAY-INIT -->
Each result subscription owns a new source and pending-duration registry.

<!-- DELAY-SOURCE-NEXT -->
delay uses one timer per source value, not a single shared debounce timer.

<!-- DELAY-SOURCE-SELECT -->
delayWhen allows multiple independently pending durations; no replacement policy.

<!-- DELAY-SELECTOR-RETURN -->
One successful selector return starts one independent duration subscription.

<!-- DELAY-SELECTOR-THROW -->
A selector failure aborts all outstanding delayed values.

<!-- DELAY-TIMER-FIRE -->
Time is supplied by scheduler event; each timer releases only its own source value.

<!-- DELAY-TIMER-FINAL -->
Last pending timer completion finishes an already-completed source.

<!-- DELAY-DURATION-NEXT-Active -->
Duration next releases its bound source payload, regardless of selector output.

<!-- DELAY-DURATION-NEXT-Closed -->
Duration next releases its bound source payload, regardless of selector output.

<!-- DELAY-DURATION-EMPTY-Active -->
An empty duration completes without releasing the source payload.

<!-- DELAY-DURATION-EMPTY-Closed -->
An empty duration completes without releasing the source payload.

<!-- DELAY-DURATION-ERROR -->
Any duration error fails the output immediately and discards other pending values.

<!-- DELAY-SOURCE-COMPLETE-WAIT -->
An outer completion cannot force early delivery: all admitted durations must settle.

<!-- DELAY-SOURCE-COMPLETE-EMPTY -->
An outer completion cannot force early delivery: all admitted durations must settle.

<!-- DELAY-SOURCE-ERROR -->
A source error never waits for delayed values or flushes them.

<!-- DELAY-CANCEL -->
Cancellation is silent and never causes a duration to fire.

**Time:** Schedulers and duration sources own time; the model only uses supplied now and ordered events.

**Sharing:** No implicit sharing or replay; multiple independent live timers/durations.

**Callbacks:** No user selector; internal constant timer selection is lowered directly into schedule actions.

**Excluded:** Promise/iterable input conversion, Date absolute delay, custom schedulers, deprecated subscriptionDelay. Reentrant producer/observer/finalizer, cancellation during callback delivery, universal metric-time guarantee.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-10.md) is reported separately from this specification.
