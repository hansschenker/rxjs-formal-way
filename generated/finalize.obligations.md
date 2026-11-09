# finalize-teardown-callback: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session12-rxjs.test.mjs.

## FINALIZE-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINALIZE-INIT.

## FINALIZE-PASS

Reach **Active** with **source live**, then provide **source.next**.

Expect, in order: forward exact value.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINALIZE-PASS.

## FINALIZE-COMPLETE

Reach **Active** with **source completes**, then provide **source.complete**.

Expect, in order: complete downstream; release source; invoke finalizer once.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINALIZE-COMPLETE.

## FINALIZE-ERROR

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: error downstream; release source; invoke finalizer once.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINALIZE-ERROR.

## FINALIZE-CANCEL

Reach **Active** with **explicit unsubscribe**, then provide **cancel**.

Expect, in order: release source; invoke finalizer once.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINALIZE-CANCEL.
