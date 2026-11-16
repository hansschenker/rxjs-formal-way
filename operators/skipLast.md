# skipLast: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Retain a bounded trailing suffix while immediately forwarding any value forced out by newer arrivals.

**Scope:** Finite nonnegative safe integer count in 0..8; zero represents the identity fast path.. State replacement precedes notification; nested source emissions are outside this bounded model.

**Dataflow shape:** `skipLast(n) : Cω(Count) × T* → T*`. For a finite successful source of N values output the first max(0,N-n) in order. A value is forwarded on arrival of the n-th subsequent source value, without a clock. Completion and cancellation never flush the retained suffix.

<!-- S19-SKIPLAST-START -->
No values are buffered before subscription.

<!-- S19-SKIPLAST-IDENTITY -->
skipLast(0) uses identity and does not retain payloads.

<!-- S19-SKIPLAST-BUFFER -->
No value can be emitted before at least count subsequent values arrive.

<!-- S19-SKIPLAST-RELEASE-OLDEST -->
Replacing the ring slot before notifying preserves correct state for synchronous observers.

<!-- S19-SKIPLAST-COMPLETE -->
The last count values are never emitted, even on completion.

<!-- S19-SKIPLAST-ERROR -->
Buffered prefix and suffix are discarded; no completion is synthesized.

<!-- S19-SKIPLAST-CANCEL -->
Cancellation never flushes buffered values.

**Time:** Emission occurs on the n-th later source next; no timer is created.

**Sharing:** No Subject or sharing. Each result subscription owns its FIFO and source subscription.

**Callbacks:** No selector or user callback; FIFO logic only.

**Excluded:** Negative, fractional, infinite and huge allocation counts; arbitrary reentrant sources or observers.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-19.md) is reported separately from this specification.
