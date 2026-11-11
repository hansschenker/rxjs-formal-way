# merge-static-2-concurrency-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session14-rxjs.test.mjs.

## S14-MERGE-INIT

Reach **Unsubscribed** with **first consumer connection**, then provide **subscribe**.

Expect, in order: subscribe source first then available others.

Resulting state: live and pending indices respect FIFO admission. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGE-INIT.

## S14-MERGE-NEXT

Reach **Active** with **resource is currently subscribed**, then provide **input.next**.

Expect, in order: forward exact payload.

Resulting state: live and pending indices respect FIFO admission. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGE-NEXT.

## S14-MERGE-REFILL

Reach **Active** with **live input complete and pending FIFO is nonempty**, then provide **input.complete**.

Expect, in order: release completed input; subscribe next waiting input.

Resulting state: live and pending indices respect FIFO admission. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGE-REFILL.

## S14-MERGE-COMPLETE-WAIT

Reach **Active** with **pending empty and other inputs live**, then provide **input.complete**.

Expect, in order: release completed input.

Resulting state: live and pending indices respect FIFO admission. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGE-COMPLETE-WAIT.

## S14-MERGE-COMPLETE-LAST

Reach **Active** with **pending empty, final live input**, then provide **input.complete**.

Expect, in order: complete result; release final input.

Resulting state: terminal, no subscriptions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGE-COMPLETE-LAST.

## S14-MERGE-ERROR

Reach **Active** with **any live source fails**, then provide **input.error**.

Expect, in order: forward exact error; release every subscribed input.

Resulting state: terminal, no subscriptions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGE-ERROR.

## S14-MERGE-CANCEL

Reach **Active** with **consumer unsubscribe**, then provide **cancel**.

Expect, in order: release all live sources, no notification.

Resulting state: terminal, no subscriptions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGE-CANCEL.
