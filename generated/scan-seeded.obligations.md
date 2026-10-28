# scan-seeded-accumulator: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/m02b-rxjs.test.mjs.

## SCAN-INIT-SEEDED

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe to the source without emitting a value or invoking the reducer.

Resulting state: active with the seed reference and index zero. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02B-SCAN-01, M02B-SCAN-02, M02B-SCAN-03.

## SCAN-CALL

Reach **Active** with **index < Number.MAX_SAFE_INTEGER**, then provide **source.next**.

Expect, in order: request one reducer call with the previous accumulation, incoming value and current source index.

Resulting state: calling with prior accumulation and input retained; next index increased by one. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02B-SCAN-04, M02B-SCAN-05, M02B-SCAN-06.

## SCAN-RETURN

Reach **Calling** with **outcome identifies the pending invocation**, then provide **callback.return**.

Expect, in order: emit the returned accumulation once.

Resulting state: active with the returned accumulation and the already advanced index. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02B-SCAN-04, M02B-SCAN-05, M02B-SCAN-07, M02B-SCAN-08.

## SCAN-THROW

Reach **Calling** with **outcome identifies the pending invocation**, then provide **callback.throw**.

Expect, in order: forward the thrown error unchanged; release the source subscription.

Resulting state: closed because the reducer threw. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02B-SCAN-09.

## SCAN-ACTIVE-COMPLETE

Reach **Active** with **no pending reducer**, then provide **source.complete**.

Expect, in order: complete downstream without another value; release the source subscription.

Resulting state: closed because the source completed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02B-SCAN-02, M02B-SCAN-10.

## SCAN-ACTIVE-ERROR

Reach **Active** with **no pending reducer**, then provide **source.error**.

Expect, in order: forward the source error unchanged; release the source subscription.

Resulting state: closed because the source errored. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02B-SCAN-11.

## SCAN-ACTIVE-CANCEL

Reach **Active** with **between resolved value reactions**, then provide **cancel**.

Expect, in order: release the source subscription without notifying downstream.

Resulting state: closed because downstream cancelled. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02B-SCAN-12.
