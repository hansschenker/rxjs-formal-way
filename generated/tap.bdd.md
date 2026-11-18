# tap-subscribe-next-error-complete-unsubscribe-finalize: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-20-SCENARIOS.md) for complete histories and their test witnesses.

## S20-TAP-START

```text
Given Unsubscribed and first consumer connection
When First connection to this result execution.
Then invoke nonthrowing subscribe hook
Then subscribe source
And Listening with next notification invocation index zero.
```

## S20-TAP-NEXT-CALL

```text
Given Listening and source is live; matching hook is configured
When A value from the currently owned source subscription.
Then invoke the matching hook with the source notification payload
And Calling next with the original notification retained; only its correlated outcome is legal.
```

## S20-TAP-NEXT-RETURN

```text
Given Calling and return matches the pending next invocation
When Return from the currently pending, correlated synchronous callback.
Then forward the exact original value
And Listening; advance invocation index and clear pending notification.
```

## S20-TAP-NEXT-THROW

```text
Given Calling and throw matches the pending next invocation
When Throw from the currently pending, correlated synchronous callback.
Then error with the exact thrown value instead of the pending notification
Then release source
Then invoke nonthrowing unsubscribe hook
Then invoke nonthrowing finalize hook
And Closed error; discard pending notification.
```

## S20-TAP-ERROR-CALL

```text
Given Listening and source is live; matching hook is configured
When Source failure with an opaque error value.
Then invoke the matching hook with the source notification payload
And Calling error with the original notification retained; only its correlated outcome is legal.
```

## S20-TAP-ERROR-RETURN

```text
Given Calling and return matches the pending error invocation
When Return from the currently pending, correlated synchronous callback.
Then forward original terminal notification
Then release source
Then invoke nonthrowing finalize hook
And Closed error; no unsubscribe hook on source termination.
```

## S20-TAP-ERROR-THROW

```text
Given Calling and throw matches the pending error invocation
When Throw from the currently pending, correlated synchronous callback.
Then error with the exact thrown value instead of the pending notification
Then release source
Then invoke nonthrowing finalize hook
And Closed error; discard pending notification.
```

## S20-TAP-COMPLETE-CALL

```text
Given Listening and source is live; matching hook is configured
When Successful source termination.
Then invoke the matching hook with the source notification payload
And Calling complete with the original notification retained; only its correlated outcome is legal.
```

## S20-TAP-COMPLETE-RETURN

```text
Given Calling and return matches the pending complete invocation
When Return from the currently pending, correlated synchronous callback.
Then forward original terminal notification
Then release source
Then invoke nonthrowing finalize hook
And Closed complete; no unsubscribe hook on source termination.
```

## S20-TAP-COMPLETE-THROW

```text
Given Calling and throw matches the pending complete invocation
When Throw from the currently pending, correlated synchronous callback.
Then error with the exact thrown value instead of the pending notification
Then release source
Then invoke nonthrowing finalize hook
And Closed error; discard pending notification.
```

## S20-TAP-CANCEL

```text
Given Listening and consumer cancels between source notifications
When Consumer closes the result connection silently.
Then release source
Then invoke nonthrowing unsubscribe hook
Then invoke nonthrowing finalize hook
And Closed cancel; no downstream terminal notification.
```
