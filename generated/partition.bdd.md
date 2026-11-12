# partition-two-independent-branch-subscriptions: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S15-PARTITION-INIT

```text
Given Unsubscribed and both returned Observables are subscribed as independent consumers
When subscribe to both returned branches in model witness
Then subscribe source once for pass branch
Then subscribe source separately for fail branch
And independent branch indices and subscription ownership
```

## S15-PARTITION-PREDICATE-REQUEST

```text
Given Active and that branch is live and not awaiting a callback
When a value arriving at an independently subscribed branch
Then request indexed branch predicate; retain opaque source value
And independent branch indices and subscription ownership
```

## S15-PARTITION-PREDICATE-RETURN

```text
Given Active and matching branch callback and boolean result
When one correlated boolean predicate outcome
Then emit on matching branch only; otherwise discard
Then clear pending callback
And independent branch indices and subscription ownership
```

## S15-PARTITION-PREDICATE-THROW-PASS-WAIT

```text
Given Active and only pass branch live and other branch live
When predicate evaluation threw
Then forward predicate throw only to this branch
Then unsubscribe this branch
And independent branch indices and subscription ownership
```

## S15-PARTITION-PREDICATE-THROW-PASS-LAST

```text
Given Active and only pass branch live and other branch closed
When predicate evaluation threw
Then forward predicate throw only to this branch
Then unsubscribe this branch
And both independent source subscriptions closed
```

## S15-PARTITION-PREDICATE-THROW-FAIL-WAIT

```text
Given Active and only fail branch live and other branch live
When predicate evaluation threw
Then forward predicate throw only to this branch
Then unsubscribe this branch
And independent branch indices and subscription ownership
```

## S15-PARTITION-PREDICATE-THROW-FAIL-LAST

```text
Given Active and only fail branch live and other branch closed
When predicate evaluation threw
Then forward predicate throw only to this branch
Then unsubscribe this branch
And both independent source subscriptions closed
```

## S15-PARTITION-SOURCE-COMPLETE-PASS-WAIT

```text
Given Active and only pass branch live and other branch live
When branch-local normal completion
Then complete this branch
Then unsubscribe this source
And independent branch indices and subscription ownership
```

## S15-PARTITION-SOURCE-COMPLETE-PASS-LAST

```text
Given Active and only pass branch live and other branch closed
When branch-local normal completion
Then complete this branch
Then unsubscribe this source
And both independent source subscriptions closed
```

## S15-PARTITION-SOURCE-COMPLETE-FAIL-WAIT

```text
Given Active and only fail branch live and other branch live
When branch-local normal completion
Then complete this branch
Then unsubscribe this source
And independent branch indices and subscription ownership
```

## S15-PARTITION-SOURCE-COMPLETE-FAIL-LAST

```text
Given Active and only fail branch live and other branch closed
When branch-local normal completion
Then complete this branch
Then unsubscribe this source
And both independent source subscriptions closed
```

## S15-PARTITION-SOURCE-ERROR-PASS-WAIT

```text
Given Active and only pass branch live and other branch live
When branch-local source failure
Then error only this branch
Then unsubscribe source
And independent branch indices and subscription ownership
```

## S15-PARTITION-SOURCE-ERROR-PASS-LAST

```text
Given Active and only pass branch live and other branch closed
When branch-local source failure
Then error only this branch
Then unsubscribe source
And both independent source subscriptions closed
```

## S15-PARTITION-SOURCE-ERROR-FAIL-WAIT

```text
Given Active and only fail branch live and other branch live
When branch-local source failure
Then error only this branch
Then unsubscribe source
And independent branch indices and subscription ownership
```

## S15-PARTITION-SOURCE-ERROR-FAIL-LAST

```text
Given Active and only fail branch live and other branch closed
When branch-local source failure
Then error only this branch
Then unsubscribe source
And both independent source subscriptions closed
```

## S15-PARTITION-BRANCH-CANCEL-PASS-WAIT

```text
Given Active and only pass branch live and other branch live
When cancel just one output branch
Then unsubscribe this branch silently
And independent branch indices and subscription ownership
```

## S15-PARTITION-BRANCH-CANCEL-PASS-LAST

```text
Given Active and only pass branch live and other branch closed
When cancel just one output branch
Then unsubscribe this branch silently
And both independent source subscriptions closed
```

## S15-PARTITION-BRANCH-CANCEL-FAIL-WAIT

```text
Given Active and only fail branch live and other branch live
When cancel just one output branch
Then unsubscribe this branch silently
And independent branch indices and subscription ownership
```

## S15-PARTITION-BRANCH-CANCEL-FAIL-LAST

```text
Given Active and only fail branch live and other branch closed
When cancel just one output branch
Then unsubscribe this branch silently
And both independent source subscriptions closed
```
