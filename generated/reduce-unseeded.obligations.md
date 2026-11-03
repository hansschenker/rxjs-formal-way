# reduce-unseeded: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session06-rxjs.test.mjs.

## AGG-REDUCE-UNSEEDED-INIT

Reach **Unsubscribed** with **fresh subscription**, then provide **subscribe**.

Expect, in order: connect source; initialize private accumulation.

Resulting state: Subscription allocates a fresh local aggregate; no seed or count value is emitted yet.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S6-REDUCE-01, S6-REDUCE-02.

## AGG-REDUCE-UNSEEDED-FIRST

Reach **Collecting** with **no memory and a safe source index**, then provide **source.next**.

Expect, in order: remember original value, no output.

Resulting state: Without seed, the first source value becomes memory. It does not invoke a reducer or comparer.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S6-REDUCE-03, S6-REDUCE-04.

## AGG-REDUCE-UNSEEDED-PLAIN-COUNT

Reach **Collecting** with **count without predicate; safe source index**, then provide **source.next**.

Expect, in order: increment private count; no output.

Resulting state: Count every source next; retain only the new count and source index. No value is emitted until completion.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S6-REDUCE-05.

## AGG-REDUCE-UNSEEDED-APPEND

Reach **Collecting** with **array profile; safe source index**, then provide **source.next**.

Expect, in order: remember one original reference in the ordered array; no output.

Resulting state: Keep a new immutable model snapshot of the values seen so far. Native toArray owns a mutable array, but emits only after completion.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S6-REDUCE-05.

## AGG-REDUCE-UNSEEDED-CALL

Reach **Collecting** with **memory exists and callback is required; safe index**, then provide **source.next**.

Expect, in order: invoke named callback with retained arguments.

Resulting state: Request exactly one callback, with the remembered value, incoming input and zero-based source index. No callback is run by the pure model.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S6-REDUCE-06, S6-REDUCE-07.

## AGG-REDUCE-UNSEEDED-RETURN

Reach **Calling** with **matches pending callback identity**, then provide **callback.return**.

Expect, in order: update aggregate from correlated callback outcome; no output.

Resulting state: Store the reducer result, add the predicate truthiness to count, or select the extremum based on comparison sign; still emit nothing.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S6-REDUCE-06, S6-REDUCE-07, S6-REDUCE-08.

## AGG-REDUCE-UNSEEDED-THROW

Reach **Calling** with **matches pending callback identity**, then provide **callback.throw**.

Expect, in order: notify error unchanged; unsubscribe source.

Resulting state: Callback failure forwards the exact thrown value, cancels upstream and discards the pending aggregate.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S6-REDUCE-09.

## AGG-REDUCE-UNSEEDED-COMPLETE-SOME

Reach **Collecting** with **aggregate memory is present**, then provide **source.complete**.

Expect, in order: notify final next; notify complete; unsubscribe source.

Resulting state: Only source completion emits the final aggregate once followed by completion, then releases the source.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S6-REDUCE-02, S6-REDUCE-10.

## AGG-REDUCE-UNSEEDED-COMPLETE-EMPTY

Reach **Collecting** with **no seed and no source values**, then provide **source.complete**.

Expect, in order: notify complete; unsubscribe source.

Resulting state: Empty unseeded reduce and empty min/max complete without emitting a value.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S6-REDUCE-02, S6-REDUCE-10.

## AGG-REDUCE-UNSEEDED-ERROR

Reach **Collecting** with **no unresolved callback**, then provide **source.error**.

Expect, in order: notify source error unchanged; unsubscribe source.

Resulting state: Source errors discard the aggregate and preserve the original error identity; no completion follows.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S6-REDUCE-11.

## AGG-REDUCE-UNSEEDED-CANCEL

Reach **Collecting** with **between resolved notifications**, then provide **cancel**.

Expect, in order: unsubscribe source without any terminal notification.

Resulting state: Unsubscription releases the upstream resource silently, without flushing the aggregate.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S6-REDUCE-12.
