# skip-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session05-rxjs.test.mjs.

## SKIP-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe to the source.

Resulting state: active at index zero. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIP-01.

## SKIP-DROP

Reach **Active** with **index < count and index < MAX_SAFE_INTEGER**, then provide **source.next**.

Expect, in order: no actions.

Resulting state: active with the source index increased by one. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIP-02.

## SKIP-PASS

Reach **Active** with **count <= index < MAX_SAFE_INTEGER**, then provide **source.next**.

Expect, in order: forward the incoming value unchanged.

Resulting state: active with the source index increased by one. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIP-02.

## SKIP-COMPLETE

Reach **Active** with **active source connection**, then provide **source.complete**.

Expect, in order: complete downstream; release the source.

Resulting state: closed because of complete. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIP-03.

## SKIP-ERROR

Reach **Active** with **active source connection**, then provide **source.error**.

Expect, in order: forward the original error; release the source.

Resulting state: closed because of source-error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIP-03.

## SKIP-CANCEL

Reach **Active** with **active source connection**, then provide **cancel**.

Expect, in order: release the source without notifying downstream.

Resulting state: closed because of cancel. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-SKIP-03.
