# multicast-factory-selector-two-branches: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session15-rxjs.test.mjs.

## S15-MULTICAST-INIT

Reach **Unsubscribed** with **fresh subscriber**, then provide **subscribe**.

Expect, in order: create local Subject; request configured selector before source connection.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-S15-MULTICAST-INIT.

## S15-MULTICAST-SELECTOR-READY

Reach **Preparing** with **matching selected Observable**, then provide **selector.return**.

Expect, in order: subscribe the selected output and its two shared branches; only then subscribe original source.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-S15-MULTICAST-SELECTOR-READY.

## S15-MULTICAST-SELECTOR-THROW

Reach **Preparing** with **selector threw before source subscription**, then provide **selector.throw**.

Expect, in order: error without subscribing source.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-S15-MULTICAST-SELECTOR-THROW.

## S15-MULTICAST-BROADCAST

Reach **Active** with **source subscribed through Subject**, then provide **source.next**.

Expect, in order: broadcast opaque value to branch 1; broadcast same value to branch 2.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-S15-MULTICAST-BROADCAST.

## S15-MULTICAST-COMPLETE

Reach **Active** with **source completes**, then provide **source.complete**.

Expect, in order: Subject completes selected branches; complete result; tear down selected then source.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-S15-MULTICAST-COMPLETE.

## S15-MULTICAST-ERROR

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: Subject errors selected branches; forward original error; release both subscriptions.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-S15-MULTICAST-ERROR.

## S15-MULTICAST-CANCEL

Reach **Active** with **downstream cancels**, then provide **cancel**.

Expect, in order: tear down selected and source, no terminal notification.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-S15-MULTICAST-CANCEL.
