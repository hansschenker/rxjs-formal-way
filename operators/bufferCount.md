# bufferCount: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Open a buffer every configured number of source values, emit full buffers, and flush residual open buffers on completion.

**Scope:** Positive safe-integer size and stride; source count remains within safe-integer range. Post-setup, atomic non-reentrant notifications; setup-time synchronous delivery, observer throw and cancellation during delivery are excluded.

**Dataflow shape:** `bufferCount(n,k) : T* -> (T*)*`. Each full buffer has size n, with possible shorter residual buffers flushed at completion. k can be less than n (overlap), equal to n (contiguous), or greater than n (gaps). An empty source completes without a bufferCount value; error and cancellation never flush.

<!-- BUFFERCOUNT-INIT -->
Construction is lazy. Each subscription initializes new state and acquires source inputs.

<!-- BUFFERCOUNT-NEXT -->
A buffer opens on source indices 0,k,2k,...; full buffers are emitted in order after the current value has been appended.

<!-- BUFFERCOUNT-SOURCE-COMPLETE -->
Completion flushes only open residual buffers; it never emits a new empty buffer if no source values created one.

<!-- BUFFERCOUNT-SOURCE-ERROR -->
Source error propagates unchanged; stored values are not emitted.

<!-- BUFFERCOUNT-CANCEL -->
Cancellation silently stops the operator and releases its owned subscriptions.

**Time:** No timer or scheduler introduced. Source/notifier order is supplied by input sequence, including equal timestamps.

**Sharing:** No sharing or replay introduced. Every result subscription has its own buffers and counters.

**Callbacks:** No user callback. Source values retain reference identity inside emitted arrays; emitted arrays are fresh snapshots.

**Excluded:** Invalid/zero/negative/fractional bufferCount arguments, count overflow and arbitrary producer reentrancy. Synchronous notifier/source delivery during subscription setup, throwing observers/finalizers and cancellation during output delivery. ObservableInput conversion outside Observable notifiers, universal symbolic equivalence and arbitrary mutation of output arrays by observers.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-07.md) is reported separately from this specification.
