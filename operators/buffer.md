# buffer: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Collect source values, emitting and resetting the array on each closing-notifier value and flushing once on source completion.

**Scope:** One valid Observable closing notifier; source and notifier remain non-reentrant. Post-setup, atomic non-reentrant notifications; setup-time synchronous delivery, observer throw and cancellation during delivery are excluded.

**Dataflow shape:** `buffer : U* -> T* -> (T*)*`. Notifier next emits one array even if no source value has arrived. Notifier completion alone has no effect on the buffered values or source lifetime. Source completion emits exactly one final array, including an empty array; error/cancellation do not flush.

<!-- BUFFER-INIT -->
Construction is lazy. Each subscription initializes new state and acquires source inputs.

<!-- BUFFER-NEXT -->
Every source value is collected in the current array; no output is produced until a notifier signal or source completion.

<!-- BUFFER-SOURCE-COMPLETE -->
Completion emits the current array, including an empty array, then completes downstream.

<!-- BUFFER-SOURCE-ERROR -->
Source error propagates unchanged; stored values are not emitted.

<!-- BUFFER-CANCEL -->
Cancellation silently stops the operator and releases its owned subscriptions.

<!-- BUFFER-NOTIFIER-NEXT -->
Each notifier value causes one output array and starts fresh collection; the notifier payload is ignored.

<!-- BUFFER-NOTIFIER-COMPLETE -->
Notifier completion without next neither flushes nor terminates the source.

<!-- BUFFER-NOTIFIER-ERROR -->
Notifier error propagates unchanged and cancels the source; no buffered values are emitted.

**Time:** No timer or scheduler introduced. Source/notifier order is supplied by input sequence, including equal timestamps.

**Sharing:** No sharing or replay introduced. Every result subscription has its own buffers and counters.

**Callbacks:** No user callback. Source values retain reference identity inside emitted arrays; emitted arrays are fresh snapshots.

**Excluded:** Invalid/zero/negative/fractional bufferCount arguments, count overflow and arbitrary producer reentrancy. Synchronous notifier/source delivery during subscription setup, throwing observers/finalizers and cancellation during output delivery. ObservableInput conversion outside Observable notifiers, universal symbolic equivalence and arbitrary mutation of output arrays by observers.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-07.md) is reported separately from this specification.
