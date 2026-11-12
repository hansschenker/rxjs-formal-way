# partition-two-independent-branch-subscriptions: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S15-PARTITION-INIT | Unsubscribed | subscribe | both returned Observables are subscribed as independent consumers | subscribe source once for pass branch; subscribe source separately for fail branch | independent branch indices and subscription ownership | S15-PARTITION-INIT |
| S15-PARTITION-PREDICATE-REQUEST | Active | source.next | that branch is live and not awaiting a callback | request indexed branch predicate; retain opaque source value | independent branch indices and subscription ownership | S15-PARTITION-PREDICATE-REQUEST |
| S15-PARTITION-PREDICATE-RETURN | Active | predicate.return | matching branch callback and boolean result | emit on matching branch only; otherwise discard; clear pending callback | independent branch indices and subscription ownership | S15-PARTITION-PREDICATE-RETURN |
| S15-PARTITION-PREDICATE-THROW-PASS-WAIT | Active | predicate.throw | only pass branch live and other branch live | forward predicate throw only to this branch; unsubscribe this branch | independent branch indices and subscription ownership | S15-PARTITION-PREDICATE-THROW-PASS-WAIT |
| S15-PARTITION-PREDICATE-THROW-PASS-LAST | Active | predicate.throw | only pass branch live and other branch closed | forward predicate throw only to this branch; unsubscribe this branch | both independent source subscriptions closed | S15-PARTITION-PREDICATE-THROW-PASS-LAST |
| S15-PARTITION-PREDICATE-THROW-FAIL-WAIT | Active | predicate.throw | only fail branch live and other branch live | forward predicate throw only to this branch; unsubscribe this branch | independent branch indices and subscription ownership | S15-PARTITION-PREDICATE-THROW-FAIL-WAIT |
| S15-PARTITION-PREDICATE-THROW-FAIL-LAST | Active | predicate.throw | only fail branch live and other branch closed | forward predicate throw only to this branch; unsubscribe this branch | both independent source subscriptions closed | S15-PARTITION-PREDICATE-THROW-FAIL-LAST |
| S15-PARTITION-SOURCE-COMPLETE-PASS-WAIT | Active | source.complete | only pass branch live and other branch live | complete this branch; unsubscribe this source | independent branch indices and subscription ownership | S15-PARTITION-SOURCE-COMPLETE-PASS-WAIT |
| S15-PARTITION-SOURCE-COMPLETE-PASS-LAST | Active | source.complete | only pass branch live and other branch closed | complete this branch; unsubscribe this source | both independent source subscriptions closed | S15-PARTITION-SOURCE-COMPLETE-PASS-LAST |
| S15-PARTITION-SOURCE-COMPLETE-FAIL-WAIT | Active | source.complete | only fail branch live and other branch live | complete this branch; unsubscribe this source | independent branch indices and subscription ownership | S15-PARTITION-SOURCE-COMPLETE-FAIL-WAIT |
| S15-PARTITION-SOURCE-COMPLETE-FAIL-LAST | Active | source.complete | only fail branch live and other branch closed | complete this branch; unsubscribe this source | both independent source subscriptions closed | S15-PARTITION-SOURCE-COMPLETE-FAIL-LAST |
| S15-PARTITION-SOURCE-ERROR-PASS-WAIT | Active | source.error | only pass branch live and other branch live | error only this branch; unsubscribe source | independent branch indices and subscription ownership | S15-PARTITION-SOURCE-ERROR-PASS-WAIT |
| S15-PARTITION-SOURCE-ERROR-PASS-LAST | Active | source.error | only pass branch live and other branch closed | error only this branch; unsubscribe source | both independent source subscriptions closed | S15-PARTITION-SOURCE-ERROR-PASS-LAST |
| S15-PARTITION-SOURCE-ERROR-FAIL-WAIT | Active | source.error | only fail branch live and other branch live | error only this branch; unsubscribe source | independent branch indices and subscription ownership | S15-PARTITION-SOURCE-ERROR-FAIL-WAIT |
| S15-PARTITION-SOURCE-ERROR-FAIL-LAST | Active | source.error | only fail branch live and other branch closed | error only this branch; unsubscribe source | both independent source subscriptions closed | S15-PARTITION-SOURCE-ERROR-FAIL-LAST |
| S15-PARTITION-BRANCH-CANCEL-PASS-WAIT | Active | branch.cancel | only pass branch live and other branch live | unsubscribe this branch silently | independent branch indices and subscription ownership | S15-PARTITION-BRANCH-CANCEL-PASS-WAIT |
| S15-PARTITION-BRANCH-CANCEL-PASS-LAST | Active | branch.cancel | only pass branch live and other branch closed | unsubscribe this branch silently | both independent source subscriptions closed | S15-PARTITION-BRANCH-CANCEL-PASS-LAST |
| S15-PARTITION-BRANCH-CANCEL-FAIL-WAIT | Active | branch.cancel | only fail branch live and other branch live | unsubscribe this branch silently | independent branch indices and subscription ownership | S15-PARTITION-BRANCH-CANCEL-FAIL-WAIT |
| S15-PARTITION-BRANCH-CANCEL-FAIL-LAST | Active | branch.cancel | only fail branch live and other branch closed | unsubscribe this branch silently | both independent source subscriptions closed | S15-PARTITION-BRANCH-CANCEL-FAIL-LAST |
