# partition-two-independent-branch-subscriptions: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session15-rxjs.test.mjs.

## S15-PARTITION-INIT

Reach **Unsubscribed** with **both returned Observables are subscribed as independent consumers**, then provide **subscribe**.

Expect, in order: subscribe source once for pass branch; subscribe source separately for fail branch.

Resulting state: independent branch indices and subscription ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-INIT.

## S15-PARTITION-PREDICATE-REQUEST

Reach **Active** with **that branch is live and not awaiting a callback**, then provide **source.next**.

Expect, in order: request indexed branch predicate; retain opaque source value.

Resulting state: independent branch indices and subscription ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-PREDICATE-REQUEST.

## S15-PARTITION-PREDICATE-RETURN

Reach **Active** with **matching branch callback and boolean result**, then provide **predicate.return**.

Expect, in order: emit on matching branch only; otherwise discard; clear pending callback.

Resulting state: independent branch indices and subscription ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-PREDICATE-RETURN.

## S15-PARTITION-PREDICATE-THROW-PASS-WAIT

Reach **Active** with **only pass branch live and other branch live**, then provide **predicate.throw**.

Expect, in order: forward predicate throw only to this branch; unsubscribe this branch.

Resulting state: independent branch indices and subscription ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-PREDICATE-THROW-PASS-WAIT.

## S15-PARTITION-PREDICATE-THROW-PASS-LAST

Reach **Active** with **only pass branch live and other branch closed**, then provide **predicate.throw**.

Expect, in order: forward predicate throw only to this branch; unsubscribe this branch.

Resulting state: both independent source subscriptions closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-PREDICATE-THROW-PASS-LAST.

## S15-PARTITION-PREDICATE-THROW-FAIL-WAIT

Reach **Active** with **only fail branch live and other branch live**, then provide **predicate.throw**.

Expect, in order: forward predicate throw only to this branch; unsubscribe this branch.

Resulting state: independent branch indices and subscription ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-PREDICATE-THROW-FAIL-WAIT.

## S15-PARTITION-PREDICATE-THROW-FAIL-LAST

Reach **Active** with **only fail branch live and other branch closed**, then provide **predicate.throw**.

Expect, in order: forward predicate throw only to this branch; unsubscribe this branch.

Resulting state: both independent source subscriptions closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-PREDICATE-THROW-FAIL-LAST.

## S15-PARTITION-SOURCE-COMPLETE-PASS-WAIT

Reach **Active** with **only pass branch live and other branch live**, then provide **source.complete**.

Expect, in order: complete this branch; unsubscribe this source.

Resulting state: independent branch indices and subscription ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-SOURCE-COMPLETE-PASS-WAIT.

## S15-PARTITION-SOURCE-COMPLETE-PASS-LAST

Reach **Active** with **only pass branch live and other branch closed**, then provide **source.complete**.

Expect, in order: complete this branch; unsubscribe this source.

Resulting state: both independent source subscriptions closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-SOURCE-COMPLETE-PASS-LAST.

## S15-PARTITION-SOURCE-COMPLETE-FAIL-WAIT

Reach **Active** with **only fail branch live and other branch live**, then provide **source.complete**.

Expect, in order: complete this branch; unsubscribe this source.

Resulting state: independent branch indices and subscription ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-SOURCE-COMPLETE-FAIL-WAIT.

## S15-PARTITION-SOURCE-COMPLETE-FAIL-LAST

Reach **Active** with **only fail branch live and other branch closed**, then provide **source.complete**.

Expect, in order: complete this branch; unsubscribe this source.

Resulting state: both independent source subscriptions closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-SOURCE-COMPLETE-FAIL-LAST.

## S15-PARTITION-SOURCE-ERROR-PASS-WAIT

Reach **Active** with **only pass branch live and other branch live**, then provide **source.error**.

Expect, in order: error only this branch; unsubscribe source.

Resulting state: independent branch indices and subscription ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-SOURCE-ERROR-PASS-WAIT.

## S15-PARTITION-SOURCE-ERROR-PASS-LAST

Reach **Active** with **only pass branch live and other branch closed**, then provide **source.error**.

Expect, in order: error only this branch; unsubscribe source.

Resulting state: both independent source subscriptions closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-SOURCE-ERROR-PASS-LAST.

## S15-PARTITION-SOURCE-ERROR-FAIL-WAIT

Reach **Active** with **only fail branch live and other branch live**, then provide **source.error**.

Expect, in order: error only this branch; unsubscribe source.

Resulting state: independent branch indices and subscription ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-SOURCE-ERROR-FAIL-WAIT.

## S15-PARTITION-SOURCE-ERROR-FAIL-LAST

Reach **Active** with **only fail branch live and other branch closed**, then provide **source.error**.

Expect, in order: error only this branch; unsubscribe source.

Resulting state: both independent source subscriptions closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-SOURCE-ERROR-FAIL-LAST.

## S15-PARTITION-BRANCH-CANCEL-PASS-WAIT

Reach **Active** with **only pass branch live and other branch live**, then provide **branch.cancel**.

Expect, in order: unsubscribe this branch silently.

Resulting state: independent branch indices and subscription ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-BRANCH-CANCEL-PASS-WAIT.

## S15-PARTITION-BRANCH-CANCEL-PASS-LAST

Reach **Active** with **only pass branch live and other branch closed**, then provide **branch.cancel**.

Expect, in order: unsubscribe this branch silently.

Resulting state: both independent source subscriptions closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-BRANCH-CANCEL-PASS-LAST.

## S15-PARTITION-BRANCH-CANCEL-FAIL-WAIT

Reach **Active** with **only fail branch live and other branch live**, then provide **branch.cancel**.

Expect, in order: unsubscribe this branch silently.

Resulting state: independent branch indices and subscription ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-BRANCH-CANCEL-FAIL-WAIT.

## S15-PARTITION-BRANCH-CANCEL-FAIL-LAST

Reach **Active** with **only fail branch live and other branch closed**, then provide **branch.cancel**.

Expect, in order: unsubscribe this branch silently.

Resulting state: both independent source subscriptions closed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-PARTITION-BRANCH-CANCEL-FAIL-LAST.
