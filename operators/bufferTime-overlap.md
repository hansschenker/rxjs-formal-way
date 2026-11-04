# bufferTime: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Accumulate source values in time-bounded windows, possibly overlapping, and emit each window on its timer or size threshold.

**Scope:** Positive safe-integer span, optional positive safe-integer creation interval, optional positive safe-integer max size; bounded virtual clock/timer generations. Deferred, non-reentrant scheduler and nonthrowing observers. Source notifications and timer firings are atomic, ordered by event sequence.

**Dataflow shape:** `bufferTime(span,creation?,max?) : T* -> (T*)*`. Each window yields one array; empty windows also emit on timer expiry. A creation interval opens overlapping windows; omitted interval restarts one window on every close. A maximum size can close a window early, before its timer; completion flushes all open windows and errors/cancellation discard. When a value fills a window, a replacement window opened by this value does not receive that same value.

<!-- BUFFERTIME-INIT -->
On subscription a first empty window opens; no source value is needed to start time accumulation.

<!-- BUFFERTIME-NEXT -->
A source next updates every already-open window. At a size threshold, windows close early and can cause a new non-overlap window to begin.

<!-- BUFFERTIME-WINDOW-FIRE -->
A timer firing at or after the deadline closes its own window. A late timer does not backdate output.

<!-- BUFFERTIME-SOURCE-COMPLETE -->
Source completion flushes every currently open window (including an empty one) and does not open another.

<!-- BUFFERTIME-SOURCE-ERROR -->
An error does not emit any currently accumulated window.

<!-- BUFFERTIME-CANCEL -->
Downstream cancellation releases resources and never flushes.

<!-- BUFFERTIME-CREATION-FIRE -->
The creation interval opens new time windows independent of current window lifetimes.

**Time:** External monotone safe-integer clock. Timer fires are explicit events, never inferred from a deadline; due firings are allowed late but not early. Equal-time order is explicit.

**Sharing:** No sharing. Each result subscription owns independent scheduled windows and accumulation arrays.

**Callbacks:** No user callback. Emitted arrays contain retained source references in arrival order.

**Excluded:** Negative/NaN/fractional/unsafe spans, zero span or zero creation interval, custom inline schedulers, arbitrary scheduler jitter guarantees. Reentrant observer/source events during a timer callback or buffer emission, throwing finalizers and cancellation inside delivery. Exact JS SchedulerAction identities, operator internals of Date.now and universal state-space equivalence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-07.md) is reported separately from this specification.
