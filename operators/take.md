# take: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Forward up to count values, then complete and release the source subscription.

**Scope:** count is a nonnegative safe integer. Atomic non-reentrant steps, observed at quiescence. No nested delivery model.

**Dataflow shape:** `take(n) : T* -> T[0..n]`. The count n is a nonnegative safe integer. The bound counts next notifications, not lifecycle actions. Reaching n values completes; an earlier source terminal or cancellation may stop with fewer values.

<!-- TAKE-INIT-ZERO -->
When the requested count is zero, subscribing completes the result immediately. The source is never subscribed to.

<!-- TAKE-INIT-POSITIVE -->
When the requested count is positive, subscribing creates a fresh counter and subscribes to the source. Constructing the model or pipeline does not connect the source.

<!-- TAKE-NEXT-PASS -->
Each source value is forwarded unchanged while the accepted-value count remains below the requested limit. The operator remembers how many values it has forwarded.

<!-- TAKE-NEXT-LAST -->
When the value that reaches the limit arrives, the operator forwards that value, completes the result, and releases the source subscription. The source need not complete first.

<!-- TAKE-SOURCE-COMPLETE -->
When the source completes before the limit, the result completes with the values already forwarded. No extra value is produced, and the source subscription is released.

<!-- TAKE-SOURCE-ERROR -->
When the source errors before the limit, the same error is forwarded and the source subscription is released. No completion notification follows the error.

<!-- TAKE-CANCEL -->
When downstream unsubscribes before termination, the source subscription is released. Unsubscription does not send a completion notification.

**Time:** No internal clock; caller supplies nonnegative trace times and same-time order.

**Sharing:** No sharing introduced; source hot/cold character is preserved.

The runtime is not generated from these paragraphs. Evidence is reported separately in the milestone record.
