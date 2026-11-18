# takeLast-2: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-20-SCENARIOS.md) for complete histories and their test witnesses.

## S20-TAKELAST-START

```text
Given Unsubscribed and first consumer connection and count > 0
When First connection to this result execution.
Then subscribe source
And Collecting with an empty FIFO buffer.
```

## S20-TAKELAST-APPEND

```text
Given Collecting and buffer has fewer than count values
When A value from the currently owned source subscription.
Then append the new value; emit nothing
And FIFO grows by one and retains arrival order.
```

## S20-TAKELAST-REPLACE-OLDEST

```text
Given Collecting and buffer has count values
When A value from the currently owned source subscription.
Then drop oldest buffered reference and append the new value; emit nothing
And FIFO contains exactly the newest count references.
```

## S20-TAKELAST-COMPLETE-FLUSH

```text
Given Collecting and source completes successfully
When Successful source termination.
Then emit retained references in FIFO order
Then complete result
Then release source
And Closed complete; the retained buffer is discarded after its output word.
```

## S20-TAKELAST-ERROR

```text
Given Collecting and source fails
When Source failure with an opaque error value.
Then forward the exact error
Then release source without flushing
And Closed error; buffered values are discarded.
```

## S20-TAKELAST-CANCEL

```text
Given Collecting and consumer closes the connection
When Consumer closes the result connection silently.
Then release source without output
And Closed cancel; buffered values are discarded.
```
