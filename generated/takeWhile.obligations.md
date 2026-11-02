# takeWhile-predicate-inclusive: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session05-rxjs.test.mjs.

## TAKEWHILE-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe to the source.

Resulting state: testing with index zero. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEWHILE-01.

## TAKEWHILE-CALL

Reach **Testing** with **index < MAX_SAFE_INTEGER**, then provide **source.next**.

Expect, in order: invoke the predicate once with the input and its zero-based index.

Resulting state: calling with retained input, invocation identity and advanced index. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEWHILE-02.

## TAKEWHILE-TRUE

Reach **Calling** with **matching invocation and truthy result**, then provide **callback.return**.

Expect, in order: forward the original value.

Resulting state: testing with the already advanced index. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEWHILE-03.

## TAKEWHILE-FALSE

Reach **Calling** with **matching invocation and falsy result**, then provide **callback.return**.

Expect, in order: forward the first predicate-failing value; complete downstream; release the source.

Resulting state: closed because the predicate failed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEWHILE-03.

## TAKEWHILE-THROW

Reach **Calling** with **matching pending invocation**, then provide **callback.throw**.

Expect, in order: forward the thrown value unchanged as an error; release the source.

Resulting state: closed because the predicate threw. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEWHILE-05.

## TAKEWHILE-TESTING-COMPLETE

Reach **Testing** with **no unresolved predicate invocation**, then provide **source.complete**.

Expect, in order: complete downstream; release the source.

Resulting state: closed because of complete. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEWHILE-06.

## TAKEWHILE-TESTING-ERROR

Reach **Testing** with **no unresolved predicate invocation**, then provide **source.error**.

Expect, in order: forward the source error unchanged; release the source.

Resulting state: closed because of source-error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEWHILE-06.

## TAKEWHILE-TESTING-CANCEL

Reach **Testing** with **no unresolved predicate invocation**, then provide **cancel**.

Expect, in order: release the source without notifying downstream.

Resulting state: closed because of cancel. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEWHILE-06.
