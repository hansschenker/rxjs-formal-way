# repeat-bounded-restart-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S17-REPEAT-START

```text
Given Unsubscribed and first downstream subscription
When connect a result
Then subscribe source generation 0
And Active with attempt=1 and failure counter=0.
```

## S17-REPEAT-NEXT

```text
Given Active and matching live source generation
When value from current source generation
Then forward value unchanged
And Remain Active with the current generation and updated failure counter.
```

## S17-REPEAT-RESTART

```text
Given Active and matching source and attempts<count
When successful source completion
Then release completed source
Then subscribe a new source generation
And New generation active with attempts incremented; old source disposed.
```

## S17-REPEAT-FINAL-COMPLETE

```text
Given Active and matching source and attempts=count
When successful source completion
Then complete result
Then release final source
And Closed complete after the specified number of source executions.
```

## S17-REPEAT-ERROR

```text
Given Active and any matching source error
When source failed
Then forward exact error and release source
And Closed in error.
```

## S17-REPEAT-CANCEL

```text
Given Active and downstream cancels active subscription
When downstream cancellation
Then release current source without an output notification
And Closed cancel.
```
