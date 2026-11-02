# skipWhile-predicate: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session05-rxjs.test.mjs.

## SKIPWHILE-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe to the source.

Resulting state: testing with index zero. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-01.

## SKIPWHILE-CALL

Reach **Testing** with **index < MAX_SAFE_INTEGER**, then provide **source.next**.

Expect, in order: invoke the predicate once with the input and its zero-based index.

Resulting state: calling with retained input, invocation identity and advanced index. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-02.

## SKIPWHILE-TRUE

Reach **Calling** with **matching invocation and truthy result**, then provide **callback.return**.

Expect, in order: no actions.

Resulting state: testing with the already advanced index. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-03.

## SKIPWHILE-FALSE

Reach **Calling** with **matching invocation and falsy result**, then provide **callback.return**.

Expect, in order: forward the first predicate-failing value.

Resulting state: permanently open; predicate no longer called. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-03.

## SKIPWHILE-OPEN-PASS

Reach **Open** with **gate has opened**, then provide **source.next**.

Expect, in order: forward the incoming value without invoking the predicate.

Resulting state: still permanently open. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-04.

## SKIPWHILE-THROW

Reach **Calling** with **matching pending invocation**, then provide **callback.throw**.

Expect, in order: forward the thrown value unchanged as an error; release the source.

Resulting state: closed because the predicate threw. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-05.

## SKIPWHILE-TESTING-COMPLETE

Reach **Testing** with **no unresolved predicate invocation**, then provide **source.complete**.

Expect, in order: complete downstream; release the source.

Resulting state: closed because of complete. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-06.

## SKIPWHILE-TESTING-ERROR

Reach **Testing** with **no unresolved predicate invocation**, then provide **source.error**.

Expect, in order: forward the source error unchanged; release the source.

Resulting state: closed because of source-error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-06.

## SKIPWHILE-TESTING-CANCEL

Reach **Testing** with **no unresolved predicate invocation**, then provide **cancel**.

Expect, in order: release the source without notifying downstream.

Resulting state: closed because of cancel. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-06.

## SKIPWHILE-OPEN-COMPLETE

Reach **Open** with **no unresolved predicate invocation**, then provide **source.complete**.

Expect, in order: complete downstream; release the source.

Resulting state: closed because of complete. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-06.

## SKIPWHILE-OPEN-ERROR

Reach **Open** with **no unresolved predicate invocation**, then provide **source.error**.

Expect, in order: forward the source error unchanged; release the source.

Resulting state: closed because of source-error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-06.

## SKIPWHILE-OPEN-CANCEL

Reach **Open** with **no unresolved predicate invocation**, then provide **cancel**.

Expect, in order: release the source without notifying downstream.

Resulting state: closed because of cancel. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIPWHILE-06.
