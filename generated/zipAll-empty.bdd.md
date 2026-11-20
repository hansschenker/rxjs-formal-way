# zipAll-deferred-fifo-8-8: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-23-ZIP-ALL.md) for complete histories and their test witnesses.

## S23-ZIPALL-START

```text
Given Unsubscribed and fresh execution
When Connect one fresh result execution.
Then acquire outer only
And Empty ordered source collection.
```

## S23-ZIPALL-COLLECT

```text
Given Collecting and collected count is below maxInners
When Retain one opaque valid Observable description occurrence.
Then retain the opaque inner description; do not connect it
And Append one source occurrence in outer arrival order.
```

## S23-ZIPALL-OUTER-EMPTY

```text
Given Collecting and no collected source occurrences
When Activate collected inputs, or complete if none exist.
Then complete downstream without an empty tuple
Then release outer
And Closed complete; discard collection.
```

## S23-ZIPALL-OUTER-JOIN

```text
Given Collecting and at least one collected source occurrence
When Activate collected inputs, or complete if none exist.
Then acquire all inners in collection order
Then release outer after inner acquisition
And One empty FIFO and live connection for each occurrence; emitted count zero.
```

## S23-ZIPALL-OUTER-ERROR

```text
Given Collecting and outer is live
When Fail without activating collected inputs.
Then error downstream with the same payload
Then release outer without connecting inners
And Closed outer-error; discard descriptions.
```

## S23-ZIPALL-CANCEL-COLLECT

```text
Given Collecting and outer connection is active
When Close owned connections without notification.
Then release outer silently
And Closed cancel; discard descriptions.
```

## S23-ZIPALL-INNER-BUFFER

```text
Given Joining and live addressed inner, room in bounded scope, another FIFO empty
When Append one value to an addressed live input FIFO.
Then append value to addressed FIFO; emit nothing
And Increase that occurrence's received count; retain all other queues.
```

## S23-ZIPALL-INNER-EMIT

```text
Given Joining and live addressed inner, all FIFOs ready after append, no completed FIFO exhausted
When Append one value to an addressed live input FIFO.
Then append value
Then remove the oldest value from every FIFO
Then emit one fresh tuple in collection order
And Increment emitted count and retain each unconsumed FIFO suffix.
```

## S23-ZIPALL-INNER-DRAIN

```text
Given Joining and all FIFOs ready after append; a completed FIFO has its final value
When Append one value to an addressed live input FIFO.
Then emit the last pairable tuple
Then release still-live inners in collection order
Then complete downstream after releases
And Closed complete; no unmatched suffix retained.
```

## S23-ZIPALL-INNER-COMPLETE-BUFFERED

```text
Given Joining and live addressed inner has queued values
When Release one input and retain its queue until exhausted.
Then release only the completed inner producer
And Mark slot no longer live, retaining its FIFO suffix.
```

## S23-ZIPALL-INNER-COMPLETE-EMPTY

```text
Given Joining and live addressed inner has no queued values
When Release one input and retain its queue until exhausted.
Then release all still-live inners in collection order
Then complete downstream after releases
And Closed complete; discard unmatched suffixes.
```

## S23-ZIPALL-INNER-ERROR

```text
Given Joining and addressed inner is still live
When Fail the entire join with this exact error.
Then error downstream with original payload
Then release all live inner producers in collection order
And Closed inner-error; discard all FIFO values.
```

## S23-ZIPALL-CANCEL-JOIN

```text
Given Joining and join owns live inputs
When Close owned connections without notification.
Then release live inners in collection order without notification
And Closed cancel; discard queues.
```
