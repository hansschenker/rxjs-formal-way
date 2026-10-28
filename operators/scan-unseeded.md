# scan: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Emit the first value as initial state, then remember and emit each subsequent reducer result.

**Scope:** unseeded scan; a named reducer binding and safe-integer source indices. Non-reentrant source, reducer and observer; cancellation only between resolved value reactions.

**Dataflow shape:** `scan : ((A + T)! x T! x Index! -> A!) -> T* -> (T + A)*`. Cω-inspired project shorthand for successful value flow; Index is the zero-based source index. One value per successfully processed source next while active; errors and cancellation can end the execution earlier. An empty source emits no accumulated value. Completion adds no final value. The first input is forwarded without invoking the reducer. The first reducer call uses index 1.

<!-- SCAN-INIT-UNSEEDED -->
On subscription, scan connects to the source without an accumulation. No value is emitted and the reducer has not run.

<!-- SCAN-FIRST -->
Without a seed, the first source value is stored and forwarded unchanged without calling the reducer. The source index still advances, so the next value invokes the reducer with index 1.

<!-- SCAN-CALL -->
Once an accumulation exists, each source value invokes the reducer once with the previous accumulation, the new value and its source index. The first index is 0 with a seed and 1 without a seed.

<!-- SCAN-RETURN -->
A successful reducer result becomes the new accumulation and is emitted unchanged. An undefined result is still a stored value. Equal successive results are not suppressed, and Observable results are not subscribed to.

<!-- SCAN-THROW -->
If the reducer throws, scan forwards the thrown value through the error channel and releases the source subscription. It emits no accumulated value for the failing input and does not complete afterwards.

<!-- SCAN-EMPTY-COMPLETE -->
An empty source completes without emitting a value or invoking the reducer.

<!-- SCAN-EMPTY-ERROR -->
A source error before the first value is forwarded without invoking the reducer or emitting an extra accumulation. The source is released.

<!-- SCAN-EMPTY-CANCEL -->
Cancellation before the first value releases the source and stops further work. It does not emit an accumulation or completion.

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
