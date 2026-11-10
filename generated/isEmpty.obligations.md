# isEmpty-short-circuit: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session13-rxjs.test.mjs.

## S13-ISEMPTY-INIT

Reach **Unsubscribed** with **new result subscription**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: updated control and subscription-local memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-ISEMPTY-INIT.

## S13-ISEMPTY-NONEMPTY

Reach **Active** with **first next value**, then provide **source.next**.

Expect, in order: emit false; complete; unsubscribe source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-ISEMPTY-NONEMPTY.

## S13-ISEMPTY-EMPTY

Reach **Active** with **source completed before next**, then provide **source.complete**.

Expect, in order: emit true; complete; release source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-ISEMPTY-EMPTY.

## S13-ISEMPTY-ERROR

Reach **Active** with **error before first next**, then provide **source.error**.

Expect, in order: forward same error; release source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-ISEMPTY-ERROR.

## S13-ISEMPTY-CANCEL

Reach **Active** with **consumer closes before result**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-ISEMPTY-CANCEL.
