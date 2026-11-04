# audit-Observable-duration: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session07-audit-rxjs.test.mjs.

## AUDIT-INIT

Reach **Unsubscribed** with **fresh valid clock**, then provide **subscribe**.

Expect, in order: subscribe to the source.

Resulting state: idle without a duration. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-INIT.

## AUDIT-START

Reach **Idle** with **valid clock, fresh generation and duration deadline**, then provide **source.next**.

Expect, in order: invoke durationSelector exactly once with this value.

Resulting state: await the correlated duration-selector outcome. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-START.

## AUDIT-REPLACE

Reach **Pending** with **duration remains active**, then provide **source.next**.

Expect, in order: no actions.

Resulting state: same duration with latest input replaced. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-REPLACE.

## AUDIT-COMPLETE-IDLE

Reach **Idle** with **no active duration**, then provide **source.complete**.

Expect, in order: complete downstream; release source.

Resulting state: closed by completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-COMPLETE-IDLE.

## AUDIT-COMPLETE-PENDING

Reach **Pending** with **duration active**, then provide **source.complete**.

Expect, in order: release completed source; retain duration.

Resulting state: waiting for duration outcome, no new source values. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-COMPLETE-PENDING.

## AUDIT-CALL-RETURN

Reach **Calling** with **matching selector invocation**, then provide **callback.return**.

Expect, in order: subscribe to returned duration Observable.

Resulting state: pending with a duration subscription. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-CALL-RETURN.

## AUDIT-CALL-THROW

Reach **Calling** with **matching selector invocation**, then provide **callback.throw**.

Expect, in order: forward thrown value; release source.

Resulting state: closed by selector error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-CALL-THROW.

## AUDIT-DURATION-NEXT

Reach **Pending** with **matching live duration next**, then provide **duration.next**.

Expect, in order: release active duration; emit latest pending source value.

Resulting state: idle and ready for the next source value. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-DURATION-NEXT.

## AUDIT-DURATION-COMPLETE

Reach **Pending** with **matching duration completion without next**, then provide **duration.complete**.

Expect, in order: release ended duration without emitting a pending value.

Resulting state: idle; next source value can start a new duration. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-DURATION-COMPLETE.

## AUDIT-DURATION-ERROR

Reach **Pending** with **matching live duration error**, then provide **duration.error**.

Expect, in order: forward duration error; release owned resources.

Resulting state: closed by duration error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-DURATION-ERROR.

## AUDIT-WAITING-DURATION-NEXT

Reach **Waiting** with **matching live duration next**, then provide **duration.next**.

Expect, in order: release active duration; emit latest pending source value; complete downstream.

Resulting state: closed by delayed completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-WAITING-DURATION-NEXT.

## AUDIT-WAITING-DURATION-COMPLETE

Reach **Waiting** with **matching duration completion without next**, then provide **duration.complete**.

Expect, in order: release ended duration without emitting a pending value; complete downstream.

Resulting state: closed without a flush. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-WAITING-DURATION-COMPLETE.

## AUDIT-WAITING-DURATION-ERROR

Reach **Waiting** with **matching live duration error**, then provide **duration.error**.

Expect, in order: forward duration error; release owned resources.

Resulting state: closed by duration error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-WAITING-DURATION-ERROR.

## AUDIT-SOURCE-ERROR-IDLE

Reach **Idle** with **valid clock and live execution**, then provide **source.error**.

Expect, in order: forward error unchanged; release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-SOURCE-ERROR-IDLE.

## AUDIT-CANCEL-IDLE

Reach **Idle** with **valid clock and live execution**, then provide **cancel**.

Expect, in order: release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-CANCEL-IDLE.

## AUDIT-SOURCE-ERROR-CALLING

Reach **Calling** with **valid clock and live execution**, then provide **source.error**.

Expect, in order: forward error unchanged; release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-SOURCE-ERROR-CALLING.

## AUDIT-CANCEL-CALLING

Reach **Calling** with **valid clock and live execution**, then provide **cancel**.

Expect, in order: release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-CANCEL-CALLING.

## AUDIT-SOURCE-ERROR-PENDING

Reach **Pending** with **valid clock and live execution**, then provide **source.error**.

Expect, in order: forward error unchanged; release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-SOURCE-ERROR-PENDING.

## AUDIT-CANCEL-PENDING

Reach **Pending** with **valid clock and live execution**, then provide **cancel**.

Expect, in order: release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-CANCEL-PENDING.

## AUDIT-CANCEL-WAITING

Reach **Waiting** with **valid clock and live execution**, then provide **cancel**.

Expect, in order: release owned subscriptions/timer without flush.

Resulting state: closed with pending value discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-AUDIT-CANCEL-WAITING.
