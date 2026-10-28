# scan: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Remember each reducer result and emit it as values arrive, starting from a supplied but un-emitted seed.

**Scope:** seeded scan; a named reducer binding and safe-integer source indices. Non-reentrant source, reducer and observer; cancellation only between resolved value reactions.

**Dataflow shape:** `scan : ((A + S)! x T! x Index! -> A!) x S! -> T* -> A*`. Cω-inspired project shorthand for successful value flow; Index is the zero-based source index. One value per successfully processed source next while active; errors and cancellation can end the execution earlier. An empty source emits no accumulated value. Completion adds no final value. S is the seed type, which may differ from the reducer result type A. The seed itself is not emitted.

<!-- SCAN-INIT-SEEDED -->
On subscription, scan remembers the supplied seed, even when it is undefined, and connects to the source. It does not emit the seed or call the reducer yet.

<!-- SCAN-CALL -->
Once an accumulation exists, each source value invokes the reducer once with the previous accumulation, the new value and its source index. The first index is 0 with a seed and 1 without a seed.

<!-- SCAN-RETURN -->
A successful reducer result becomes the new accumulation and is emitted unchanged. An undefined result is still a stored value. Equal successive results are not suppressed, and Observable results are not subscribed to.

<!-- SCAN-THROW -->
If the reducer throws, scan forwards the thrown value through the error channel and releases the source subscription. It emits no accumulated value for the failing input and does not complete afterwards.

<!-- SCAN-ACTIVE-COMPLETE -->
Source completion completes the result and releases upstream. There is no extra final accumulated value, even when a seed was supplied.

<!-- SCAN-ACTIVE-ERROR -->
A source error while an accumulation exists is forwarded without invoking the reducer or emitting an extra accumulation. The source is released.

<!-- SCAN-ACTIVE-CANCEL -->
Cancellation between accumulated values releases the source and stops further work. It does not emit an accumulation or completion.

**Time:** No clock or timer. Source and callback-outcome events use supplied timestamps and explicit sequence order.

**Sharing:** Each subscription owns its index and accumulation binding; no sharing or replay is introduced. Seed/result object references are not cloned and may be externally shared.

**Callbacks:** The pure model requests a call with { accumulator, value } and index; an external adapter invokes reducer(accumulator, value, index) exactly once and returns a correlated outcome.

**Excluded:** Nested input or cancellation during reducer/observer delivery; throwing finalizers or observers. Index precision loss, invalid reducer arguments, and universal symbolic equivalence. Deep cloning or freezing of seed/results, lossless arbitrary-value JSON encoding, and a production interpreter. Arbitrary mutation of referenced objects is not represented as a separate state event; immutable reducers are the differential-test domain.

The runtime is not generated from these paragraphs. [Evidence](../evidence/M02-B.md) is reported separately from this specification.
