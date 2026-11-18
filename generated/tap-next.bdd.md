# tap-next: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-20-SCENARIOS.md) for complete histories and their test witnesses.

## S20-TAP-START

```text
Given Unsubscribed and first consumer connection
When First connection to this result execution.
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
And Closed error; discard pending notification.
```

## S20-TAP-ERROR-PASS

```text
Given Listening and source is live; matching hook is absent
When Source failure with an opaque error value.
Then forward the unchanged notification
Then release source and invoke configured finalize hook
And Closed after source termination.
```

## S20-TAP-COMPLETE-PASS

```text
Given Listening and source is live; matching hook is absent
When Successful source termination.
Then forward the unchanged notification
Then release source and invoke configured finalize hook
And Closed after source termination.
```

## S20-TAP-CANCEL

```text
Given Listening and consumer cancels between source notifications
When Consumer closes the result connection silently.
Then release source
And Closed cancel; no downstream terminal notification.
```
