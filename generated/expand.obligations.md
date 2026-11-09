# expand-unbounded: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session12-rxjs.test.mjs.

## EXPAND-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe outer source.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-INIT.

## EXPAND-OUTER-ADMIT

Reach **Active** with **capacity available**, then provide **outer.next**.

Expect, in order: emit input first; invoke projection with zero-based expansion index.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-OUTER-ADMIT.

## EXPAND-INNER-ADMIT-ACTIVE

Reach **Active** with **known inner and expansion capacity available**, then provide **inner.next**.

Expect, in order: emit recursive value; feed recursive value into projection.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-INNER-ADMIT-ACTIVE.

## EXPAND-INNER-ADMIT-DRAINING

Reach **Draining** with **known inner and expansion capacity available**, then provide **inner.next**.

Expect, in order: emit recursive value; feed recursive value into projection.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-INNER-ADMIT-DRAINING.

## EXPAND-PROJECT-RETURN

Reach **Calling** with **correlated projection return while outer open**, then provide **callback.return**.

Expect, in order: subscribe returned inner occurrence.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-PROJECT-RETURN.

## EXPAND-PROJECT-RETURN-DRAINING

Reach **Calling** with **correlated projection return after outer completion**, then provide **callback.return**.

Expect, in order: subscribe returned inner occurrence.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-PROJECT-RETURN-DRAINING.

## EXPAND-PROJECT-THROW

Reach **Calling** with **correlated projection throws**, then provide **callback.throw**.

Expect, in order: error downstream; release all owned subscriptions.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-PROJECT-THROW.

## EXPAND-INNER-COMPLETE-ACTIVE

Reach **Active** with **known inner completes with no queued value**, then provide **inner.complete**.

Expect, in order: release completed inner.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-INNER-COMPLETE-ACTIVE.

## EXPAND-INNER-COMPLETE-DRAINING-MORE

Reach **Draining** with **known inner completes but other recursive work remains**, then provide **inner.complete**.

Expect, in order: release completed inner.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-INNER-COMPLETE-DRAINING-MORE.

## EXPAND-INNER-COMPLETE-DRAINING-LAST

Reach **Draining** with **last known inner completes and no queue remains**, then provide **inner.complete**.

Expect, in order: release completed inner; complete downstream.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-INNER-COMPLETE-DRAINING-LAST.

## EXPAND-INNER-ERROR-ACTIVE

Reach **Active** with **known inner errors**, then provide **inner.error**.

Expect, in order: forward exact error; release outer if open and all active inners.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-INNER-ERROR-ACTIVE.

## EXPAND-INNER-ERROR-DRAINING

Reach **Draining** with **known inner errors**, then provide **inner.error**.

Expect, in order: forward exact error; release outer if open and all active inners.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-INNER-ERROR-DRAINING.

## EXPAND-OUTER-COMPLETE

Reach **Active** with **recursive work remains active or queued**, then provide **outer.complete**.

Expect, in order: release outer and wait.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-OUTER-COMPLETE.

## EXPAND-OUTER-COMPLETE-IDLE

Reach **Active** with **no recursive work remains**, then provide **outer.complete**.

Expect, in order: release outer; complete downstream.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-OUTER-COMPLETE-IDLE.

## EXPAND-OUTER-ERROR

Reach **Active** with **outer errors**, then provide **outer.error**.

Expect, in order: forward exact error; release outer and all active inners.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-OUTER-ERROR.

## EXPAND-CANCEL-ACTIVE

Reach **Active** with **downstream closes**, then provide **cancel**.

Expect, in order: release owned subscriptions silently.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-CANCEL-ACTIVE.

## EXPAND-CANCEL-DRAINING

Reach **Draining** with **downstream closes**, then provide **cancel**.

Expect, in order: release owned subscriptions silently.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-CANCEL-DRAINING.

## EXPAND-CANCEL-CALLING

Reach **Calling** with **downstream closes between callback request and outcome**, then provide **cancel**.

Expect, in order: release owned subscriptions silently.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-EXPAND-CANCEL-CALLING.
