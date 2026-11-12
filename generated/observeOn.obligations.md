# observeOn-virtual-fifo-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session15-rxjs.test.mjs.

## S15-OBSERVEON-INIT

Reach **Unsubscribed** with **first subscription**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: ordered notifications and source ownership retained. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-OBSERVEON-INIT.

## S15-OBSERVEON-QUEUE-NEXT

Reach **Active** with **source live and time is valid**, then provide **source.next**.

Expect, in order: queue one scheduled next.

Resulting state: ordered notifications and source ownership retained. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-OBSERVEON-QUEUE-NEXT.

## S15-OBSERVEON-QUEUE-COMPLETE

Reach **Active** with **source live and time valid**, then provide **source.complete**.

Expect, in order: queue scheduled completion; release source.

Resulting state: ordered notifications and source ownership retained. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-OBSERVEON-QUEUE-COMPLETE.

## S15-OBSERVEON-QUEUE-ERROR

Reach **Active** with **source live and time valid**, then provide **source.error**.

Expect, in order: queue original error; release source.

Resulting state: ordered notifications and source ownership retained. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-OBSERVEON-QUEUE-ERROR.

## S15-OBSERVEON-FIRE-NEXT

Reach **Active** with **head scheduled notification is next and due**, then provide **timer.fire**.

Expect, in order: emit remembered payload; retire timer.

Resulting state: ordered notifications and source ownership retained. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-OBSERVEON-FIRE-NEXT.

## S15-OBSERVEON-FIRE-COMPLETE

Reach **Active** with **head scheduled completion is due**, then provide **timer.fire**.

Expect, in order: complete result; retire timer.

Resulting state: terminal; no scheduled notifications remain. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-OBSERVEON-FIRE-COMPLETE.

## S15-OBSERVEON-FIRE-ERROR

Reach **Active** with **head scheduled source error is due**, then provide **timer.fire**.

Expect, in order: forward exact original error; retire timer.

Resulting state: terminal; no scheduled notifications remain. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-OBSERVEON-FIRE-ERROR.

## S15-OBSERVEON-CANCEL

Reach **Active** with **downstream unsubscribed**, then provide **cancel**.

Expect, in order: cancel all scheduled actions; release live source, no terminal.

Resulting state: terminal; no scheduled notifications remain. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-OBSERVEON-CANCEL.
