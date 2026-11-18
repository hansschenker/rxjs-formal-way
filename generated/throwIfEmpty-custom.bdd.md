# throwIfEmpty-custom: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-20-SCENARIOS.md) for complete histories and their test witnesses.

## S20-THROWIFEMPTY-START

```text
Given Unsubscribed and first consumer connection
When First connection to this result execution.
Then subscribe source
And Listening with hasValue=false.
```

## S20-THROWIFEMPTY-NEXT

```text
Given Listening and source subscription is live
When A value from the currently owned source subscription.
Then forward exact source value
And Listening with hasValue=true, including when the value is undefined.
```

## S20-THROWIFEMPTY-COMPLETE-NONEMPTY

```text
Given Listening and at least one value has arrived
When Successful source termination.
Then complete result
Then release source
And Closed complete; never invoke the factory.
```

## S20-THROWIFEMPTY-COMPLETE-EMPTY

```text
Given Listening and no value has arrived
When Successful source termination.
Then invoke the selected error factory once
And CreatingError; waiting only for its correlated synchronous outcome.
```

## S20-THROWIFEMPTY-FACTORY-RETURN

```text
Given CreatingError and outcome belongs to errorFactory invocation zero
When Return from the currently pending, correlated synchronous callback.
Then error with the exact returned value
Then release source
And Closed error; no completion notification.
```

## S20-THROWIFEMPTY-FACTORY-THROW

```text
Given CreatingError and outcome belongs to errorFactory invocation zero
When Throw from the currently pending, correlated synchronous callback.
Then forward the exact thrown value as error
Then release source
And Closed error; no completion notification.
```

## S20-THROWIFEMPTY-SOURCE-ERROR

```text
Given Listening and source fails, regardless of value presence
When Source failure with an opaque error value.
Then forward exact source error
Then release source
And Closed error; factory never invoked.
```

## S20-THROWIFEMPTY-CANCEL

```text
Given Listening and consumer cancels before source termination
When Consumer closes the result connection silently.
Then release source silently
And Closed cancel; factory never invoked.
```
