# combineLatestAll-deferred-latest-array: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session08-rxjs.test.mjs.

## COMBINELATESTALL-INIT

Reach **Unsubscribed** with **fresh subscription**, then provide **subscribe**.

Expect, in order: connect outer.

Resulting state: preserve ordered source and latest bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-INIT.

## COMBINELATESTALL-OUTER-NEXT

Reach **Collecting** with **outer still open; bounded count**, then provide **outer.next**.

Expect, in order: retain source identity in arrival order.

Resulting state: preserve ordered source and latest bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-OUTER-NEXT.

## COMBINELATESTALL-OUTER-EMPTY

Reach **Collecting** with **no collected inner sources**, then provide **outer.complete**.

Expect, in order: complete without value; release outer.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-OUTER-EMPTY.

## COMBINELATESTALL-OUTER-JOIN

Reach **Collecting** with **at least one collected inner source**, then provide **outer.complete**.

Expect, in order: release outer; subscribe all collected inner sources in arrival order.

Resulting state: preserve ordered source and latest bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-OUTER-JOIN.

## COMBINELATESTALL-OUTER-ERROR

Reach **Collecting** with **outer still active**, then provide **outer.error**.

Expect, in order: error without joining any inners; release outer.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-OUTER-ERROR.

## COMBINELATESTALL-INNER-WAIT

Reach **Joining** with **live inner and at least one slot remains unready**, then provide **inner.next**.

Expect, in order: record latest and first-value status; no output.

Resulting state: preserve ordered source and latest bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-INNER-WAIT.

## COMBINELATESTALL-INNER-EMIT

Reach **Joining** with **live inner and every other slot ready**, then provide **inner.next**.

Expect, in order: update one latest value; emit fresh ordered tuple.

Resulting state: preserve ordered source and latest bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-INNER-EMIT.

## COMBINELATESTALL-INNER-COMPLETE-WAIT

Reach **Joining** with **live inner and another still live**, then provide **inner.complete**.

Expect, in order: release completed inner, retain its last value.

Resulting state: preserve ordered source and latest bindings. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-INNER-COMPLETE-WAIT.

## COMBINELATESTALL-INNER-COMPLETE-LAST

Reach **Joining** with **final live inner**, then provide **inner.complete**.

Expect, in order: complete; release final inner.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-INNER-COMPLETE-LAST.

## COMBINELATESTALL-INNER-ERROR

Reach **Joining** with **matching live inner**, then provide **inner.error**.

Expect, in order: error immediately; release all live inner subscriptions.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-INNER-ERROR.

## COMBINELATESTALL-CANCEL-COLLECT

Reach **Collecting** with **outer live**, then provide **cancel**.

Expect, in order: release outer silently.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-CANCEL-COLLECT.

## COMBINELATESTALL-CANCEL-JOIN

Reach **Joining** with **join live**, then provide **cancel**.

Expect, in order: release live inners silently.

Resulting state: terminal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S8-COMBINELATESTALL-CANCEL-JOIN.
