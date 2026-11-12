# partition-two-independent-branch-subscriptions: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S15-PARTITION-INIT subscribe [both returned Observables are subscribed as independent consumers]
    s1 --> s1 : S15-PARTITION-PREDICATE-REQUEST source.next [that branch is live and not awaiting a callback]
    s1 --> s1 : S15-PARTITION-PREDICATE-RETURN predicate.return [matching branch callback and boolean result]
    s1 --> s1 : S15-PARTITION-PREDICATE-THROW-PASS-WAIT predicate.throw [only pass branch live and other branch live]
    s1 --> s2 : S15-PARTITION-PREDICATE-THROW-PASS-LAST predicate.throw [only pass branch live and other branch closed]
    s1 --> s1 : S15-PARTITION-PREDICATE-THROW-FAIL-WAIT predicate.throw [only fail branch live and other branch live]
    s1 --> s2 : S15-PARTITION-PREDICATE-THROW-FAIL-LAST predicate.throw [only fail branch live and other branch closed]
    s1 --> s1 : S15-PARTITION-SOURCE-COMPLETE-PASS-WAIT source.complete [only pass branch live and other branch live]
    s1 --> s2 : S15-PARTITION-SOURCE-COMPLETE-PASS-LAST source.complete [only pass branch live and other branch closed]
    s1 --> s1 : S15-PARTITION-SOURCE-COMPLETE-FAIL-WAIT source.complete [only fail branch live and other branch live]
    s1 --> s2 : S15-PARTITION-SOURCE-COMPLETE-FAIL-LAST source.complete [only fail branch live and other branch closed]
    s1 --> s1 : S15-PARTITION-SOURCE-ERROR-PASS-WAIT source.error [only pass branch live and other branch live]
    s1 --> s2 : S15-PARTITION-SOURCE-ERROR-PASS-LAST source.error [only pass branch live and other branch closed]
    s1 --> s1 : S15-PARTITION-SOURCE-ERROR-FAIL-WAIT source.error [only fail branch live and other branch live]
    s1 --> s2 : S15-PARTITION-SOURCE-ERROR-FAIL-LAST source.error [only fail branch live and other branch closed]
    s1 --> s1 : S15-PARTITION-BRANCH-CANCEL-PASS-WAIT branch.cancel [only pass branch live and other branch live]
    s1 --> s2 : S15-PARTITION-BRANCH-CANCEL-PASS-LAST branch.cancel [only pass branch live and other branch closed]
    s1 --> s1 : S15-PARTITION-BRANCH-CANCEL-FAIL-WAIT branch.cancel [only fail branch live and other branch live]
    s1 --> s2 : S15-PARTITION-BRANCH-CANCEL-FAIL-LAST branch.cancel [only fail branch live and other branch closed]
```
