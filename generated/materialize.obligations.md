# materialize-notifications: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session14-rxjs.test.mjs.

## S14-MATERIALIZE-INIT

Reach **Unsubscribed** with **first consumer subscription**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: one subscribed source. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MATERIALIZE-INIT.

## S14-MATERIALIZE-NEXT

Reach **Active** with **source next value, including undefined**, then provide **source.next**.

Expect, in order: emit N Notification as next.

Resulting state: one subscribed source. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MATERIALIZE-NEXT.

## S14-MATERIALIZE-END

Reach **Active** with **source completes normally**, then provide **source.complete**.

Expect, in order: emit C Notification as next; complete output; release source.

Resulting state: no owned source and no legal late events. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MATERIALIZE-END.

## S14-MATERIALIZE-FAIL

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: emit E Notification as next; complete output; release source.

Resulting state: no owned source and no legal late events. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MATERIALIZE-FAIL.

## S14-MATERIALIZE-CANCEL

Reach **Active** with **consumer cancels**, then provide **cancel**.

Expect, in order: release source without notifications.

Resulting state: no owned source and no legal late events. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MATERIALIZE-CANCEL.
