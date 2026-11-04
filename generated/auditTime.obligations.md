# auditTime-3: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session07-audit-rxjs.test.mjs.

## AUDITTIME-INIT

Reach **Unsubscribed** with **fresh valid clock**, then provide **subscribe**.

Expect, in order: subscribe to the source.

Resulting state: idle without a duration. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-INIT.

## AUDITTIME-START

Reach **Idle** with **valid clock, fresh generation and duration deadline**, then provide **source.next**.

Expect, in order: schedule one timer; retain the input.

Resulting state: pending with one scheduled duration and latest value. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-START.

## AUDITTIME-REPLACE

Reach **Pending** with **duration remains active**, then provide **source.next**.

Expect, in order: no actions.

Resulting state: same duration with latest input replaced. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-REPLACE.

## AUDITTIME-COMPLETE-IDLE

Reach **Idle** with **no active duration**, then provide **source.complete**.

Expect, in order: complete downstream; release source.

Resulting state: closed by completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-COMPLETE-IDLE.

## AUDITTIME-COMPLETE-PENDING

Reach **Pending** with **duration active**, then provide **source.complete**.

Expect, in order: release completed source; retain duration.

Resulting state: waiting for duration outcome, no new source values. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-COMPLETE-PENDING.

## AUDITTIME-DURATION-NEXT

Reach **Pending** with **matching timer identity at or after deadline**, then provide **timer.fire**.

Expect, in order: release active duration; emit latest pending source value.

Resulting state: idle and ready for the next source value. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-DURATION-NEXT.

## AUDITTIME-WAITING-DURATION-NEXT

Reach **Waiting** with **matching timer identity at or after deadline**, then provide **timer.fire**.

Expect, in order: release active duration; emit latest pending source value; complete downstream.

Resulting state: closed by delayed completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-WAITING-DURATION-NEXT.

## AUDITTIME-SOURCE-ERROR-IDLE

Reach **Idle** with **valid clock and live execution**, then provide **source.error**.

Expect, in order: forward error unchanged; release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-SOURCE-ERROR-IDLE.

## AUDITTIME-CANCEL-IDLE

Reach **Idle** with **valid clock and live execution**, then provide **cancel**.

Expect, in order: release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-CANCEL-IDLE.

## AUDITTIME-SOURCE-ERROR-PENDING

Reach **Pending** with **valid clock and live execution**, then provide **source.error**.

Expect, in order: forward error unchanged; release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-SOURCE-ERROR-PENDING.

## AUDITTIME-CANCEL-PENDING

Reach **Pending** with **valid clock and live execution**, then provide **cancel**.

Expect, in order: release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-CANCEL-PENDING.

## AUDITTIME-CANCEL-WAITING

Reach **Waiting** with **valid clock and live execution**, then provide **cancel**.

Expect, in order: release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDITTIME-CANCEL-WAITING.
