# retry-bounded-restart-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S17-RETRY-START

```text
Given Unsubscribed and first downstream subscription
When connect a result
Then subscribe source generation 0
And Active with attempt=1 and failure counter=0.
```

## S17-RETRY-NEXT

```text
Given Active and matching live source generation
When value from current source generation
Then forward value unchanged
And Remain Active with the current generation and updated failure counter.
```

## S17-RETRY-COMPLETE

```text
Given Active and successful source completion
When successful source completion
Then complete downstream and release source
And Closed complete.
```

## S17-RETRY-RETRY

```text
Given Active and matching source and failureCount<count
When source failed
Then release failed source
Then subscribe next source execution
And New generation active; failure counter and attempt incremented.
```

## S17-RETRY-RETRY-EXHAUSTED

```text
Given Active and matching error and retry budget exhausted
When source failed
Then emit original error unchanged
Then dispose final source
And Closed in error.
```

## S17-RETRY-CANCEL

```text
Given Active and downstream cancels active subscription
When downstream cancellation
Then release current source without an output notification
And Closed cancel.
```
