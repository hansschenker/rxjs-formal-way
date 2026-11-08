# dematerialize-notification-values: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session11-rxjs.test.mjs.

## DEMATERIALIZE-INIT

Reach **Unsubscribed** with **fresh subscription**, then provide **subscribe**.

Expect, in order: acquire source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-DEMATERIALIZE-INIT.

## DEMATERIALIZE-NEXT

Reach **Active** with **notification.kind=N**, then provide **source.next**.

Expect, in order: forward embedded payload.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-DEMATERIALIZE-NEXT.

## DEMATERIALIZE-EMBEDDED-COMPLETE

Reach **Active** with **notification.kind=C**, then provide **source.next**.

Expect, in order: complete downstream; release source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-DEMATERIALIZE-EMBEDDED-COMPLETE.

## DEMATERIALIZE-EMBEDDED-ERROR

Reach **Active** with **notification.kind=E**, then provide **source.next**.

Expect, in order: error with embedded identity; release source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-DEMATERIALIZE-EMBEDDED-ERROR.

## DEMATERIALIZE-SOURCE-COMPLETE

Reach **Active** with **source completes without embedded terminal**, then provide **source.complete**.

Expect, in order: complete; release source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-DEMATERIALIZE-SOURCE-COMPLETE.

## DEMATERIALIZE-SOURCE-ERROR

Reach **Active** with **outer errors**, then provide **source.error**.

Expect, in order: forward source error; release source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-DEMATERIALIZE-SOURCE-ERROR.

## DEMATERIALIZE-CANCEL

Reach **Active** with **downstream closes**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-DEMATERIALIZE-CANCEL.
