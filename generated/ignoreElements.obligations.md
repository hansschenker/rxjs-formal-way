# ignoreElements-discard-next: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session13-rxjs.test.mjs.

## S13-IGNOREELEMENTS-INIT

Reach **Unsubscribed** with **new result subscription**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: updated control and subscription-local memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-IGNOREELEMENTS-INIT.

## S13-IGNOREELEMENTS-DROP

Reach **Active** with **every source value**, then provide **source.next**.

Expect, in order: no downstream next.

Resulting state: updated control and subscription-local memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-IGNOREELEMENTS-DROP.

## S13-IGNOREELEMENTS-COMPLETE

Reach **Active** with **normal termination**, then provide **source.complete**.

Expect, in order: forward complete; release source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-IGNOREELEMENTS-COMPLETE.

## S13-IGNOREELEMENTS-ERROR

Reach **Active** with **failure**, then provide **source.error**.

Expect, in order: forward identical error; release source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-IGNOREELEMENTS-ERROR.

## S13-IGNOREELEMENTS-CANCEL

Reach **Active** with **downstream unsubscribed**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-IGNOREELEMENTS-CANCEL.
