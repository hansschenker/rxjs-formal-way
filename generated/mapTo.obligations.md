# mapTo-constant: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session13-rxjs.test.mjs.

## S13-MAPTO-INIT

Reach **Unsubscribed** with **new subscription**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: updated control and subscription-local memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-MAPTO-INIT.

## S13-MAPTO-REPLACE

Reach **Active** with **every input next**, then provide **source.next**.

Expect, in order: emit original constant instance.

Resulting state: updated control and subscription-local memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-MAPTO-REPLACE.

## S13-MAPTO-COMPLETE

Reach **Active** with **source completes**, then provide **source.complete**.

Expect, in order: complete; release source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-MAPTO-COMPLETE.

## S13-MAPTO-ERROR

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: forward error; release source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-MAPTO-ERROR.

## S13-MAPTO-CANCEL

Reach **Active** with **downstream cancels**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-MAPTO-CANCEL.
