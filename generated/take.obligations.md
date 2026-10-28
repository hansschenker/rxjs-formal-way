# take-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/m01-rxjs.test.mjs.

## TAKE-INIT-ZERO

Reach **Unsubscribed** with **count = 0**, then provide **subscribe**.

Expect, in order: complete downstream without subscribing to the source.

Resulting state: closed because the quota is zero. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M01-RX-01.

## TAKE-INIT-POSITIVE

Reach **Unsubscribed** with **count > 0**, then provide **subscribe**.

Expect, in order: subscribe to the source.

Resulting state: active with seen = 0. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M01-RX-02, M01-RX-08.

## TAKE-NEXT-PASS

Reach **Active** with **seen + 1 < count**, then provide **source.next**.

Expect, in order: forward the incoming value unchanged.

Resulting state: active with seen increased by one. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M01-RX-02, M01-RX-09.

## TAKE-NEXT-LAST

Reach **Active** with **seen + 1 = count**, then provide **source.next**.

Expect, in order: forward the incoming value unchanged; complete downstream; release the source subscription.

Resulting state: closed because the quota was reached. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M01-RX-02, M01-RX-06, M01-RX-07.

## TAKE-SOURCE-COMPLETE

Reach **Active** with **source completes before the quota**, then provide **source.complete**.

Expect, in order: complete downstream; release the source subscription.

Resulting state: closed because the source completed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M01-RX-03.

## TAKE-SOURCE-ERROR

Reach **Active** with **source errors before the quota**, then provide **source.error**.

Expect, in order: forward the source error unchanged; release the source subscription.

Resulting state: closed because the source errored. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M01-RX-04.

## TAKE-CANCEL

Reach **Active** with **downstream cancels before termination**, then provide **cancel**.

Expect, in order: release the source subscription without notifying downstream.

Resulting state: closed because downstream cancelled. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M01-RX-05, M01-RX-10.
