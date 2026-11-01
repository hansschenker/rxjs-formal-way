# distinct-direct-flush: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session4-rxjs.test.mjs.

## DISTINCT-INIT

Reach **Unsubscribed** with **fresh result subscription**, then provide **subscribe**.

Expect, in order: subscribe source; subscribe flush notifier if configured; source first.

Resulting state: active with empty Set and optional flush subscription. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-INIT.

## DISTINCT-SELECT

Reach **Active** with **selector configured and index is valid**, then provide **source.next**.

Expect, in order: request a correlated key selection with the original value.

Resulting state: selecting a key with existing Set retained. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-SELECT.

## DISTINCT-DIRECT-PASS

Reach **Active** with **no key selector and Set does not contain incoming value under SameValueZero**, then provide **source.next**.

Expect, in order: add original value to Set before forwarding it.

Resulting state: active with enlarged Set. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-DIRECT.

## DISTINCT-DIRECT-DROP

Reach **Active** with **no key selector and Set already contains incoming value under SameValueZero**, then provide **source.next**.

Expect, in order: no actions.

Resulting state: active with unchanged Set and increased index. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-DIRECT.

## DISTINCT-KEY-PASS

Reach **Selecting** with **matching selection and previously unseen key under SameValueZero**, then provide **key.return**.

Expect, in order: add selected key then forward original source value.

Resulting state: active with enlarged keyed Set. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-KEY.

## DISTINCT-KEY-DROP

Reach **Selecting** with **matching selection and previously seen key under SameValueZero**, then provide **key.return**.

Expect, in order: no actions.

Resulting state: active with unchanged Set. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-KEY.

## DISTINCT-KEY-ERROR

Reach **Selecting** with **matching selector invocation**, then provide **key.throw**.

Expect, in order: forward exact selector error; release source and active notifier.

Resulting state: closed by selector error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-THROW.

## DISTINCT-FLUSH

Reach **Active** with **notifier still active**, then provide **flush.next**.

Expect, in order: clear the Set without forwarding the flush value.

Resulting state: active with empty Set. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-FLUSH.

## DISTINCT-FLUSH-COMPLETE

Reach **Active** with **notifier still active**, then provide **flush.complete**.

Expect, in order: release notifier subscription without completing downstream or clearing the Set.

Resulting state: active, with the existing Set but no future flush events. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-FLUSH.

## DISTINCT-FLUSH-ERROR

Reach **Active** with **notifier still active**, then provide **flush.error**.

Expect, in order: forward exact notifier error; release both subscriptions.

Resulting state: closed after notifier error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-FLUSH.

## DISTINCT-COMPLETE

Reach **Active** with **no pending selector**, then provide **source.complete**.

Expect, in order: complete result; release source and active notifier.

Resulting state: closed after source completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-LIFECYCLE.

## DISTINCT-ERROR

Reach **Active** with **no pending selector**, then provide **source.error**.

Expect, in order: forward exact source error; release source and active notifier.

Resulting state: closed after source error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-LIFECYCLE.

## DISTINCT-CANCEL

Reach **Active** with **between completed source reactions**, then provide **cancel**.

Expect, in order: release source and active notifier without downstream completion.

Resulting state: closed by cancellation. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCT-LIFECYCLE.
