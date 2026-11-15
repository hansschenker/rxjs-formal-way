# sequenceEqual-strict-FIFO-32: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S18-SEQUENCEEQUAL-START

```text
Given Unsubscribed and first downstream subscription
When start comparison
Then subscribe source first
Then subscribe compareTo second
And Comparing with empty queues and two live source subscriptions.
```

## S18-SEQUENCEEQUAL-LEFT-QUEUE

```text
Given Comparing and current side live, opposite FIFO empty and incomplete; buffer below cap
When source value
Then append exact payload to unmatched FIFO
And Append one unmatched payload to current side FIFO.
```

## S18-SEQUENCEEQUAL-LEFT-EXTRA

```text
Given Comparing and opposite stream already completed and has no unmatched value
When source value
Then emit false, complete and release remaining subscriptions
And Closed unequal immediately.
```

## S18-SEQUENCEEQUAL-LEFT-MATCH

```text
Given Comparing and opposite FIFO nonempty and strict equality holds against its oldest value
When source value
Then discard one oldest opposite FIFO entry; no output
And Opposite FIFO shrinks by one while both completion flags remain unchanged.
```

## S18-SEQUENCEEQUAL-LEFT-DIFFER

```text
Given Comparing and opposite FIFO nonempty and strict equality fails
When source value
Then emit false then complete; release all live sources
And Closed unequal immediately.
```

## S18-SEQUENCEEQUAL-LEFT-FIRST-COMPLETE

```text
Given Comparing and current side is live and the other side is not yet completed
When source completed
Then release completed source subscription; retain unmatched FIFO
And Mark side completed and await the other stream.
```

## S18-SEQUENCEEQUAL-LEFT-FINAL-EQUAL

```text
Given Comparing and opposite stream already completed; unmatched buffers both empty
When source completed
Then emit true and complete
Then release final subscription
And Closed equal.
```

## S18-SEQUENCEEQUAL-LEFT-FINAL-UNEVEN

```text
Given Comparing and opposite stream already completed; unmatched buffers not empty
When source completed
Then emit false and complete
Then release final subscription
And Closed unequal.
```

## S18-SEQUENCEEQUAL-LEFT-ERROR

```text
Given Comparing and current side is live
When source error
Then forward exact error identity
Then release all live subscriptions
And Closed error.
```

## S18-SEQUENCEEQUAL-RIGHT-QUEUE

```text
Given Comparing and current side live, opposite FIFO empty and incomplete; buffer below cap
When compareTo value
Then append exact payload to unmatched FIFO
And Append one unmatched payload to current side FIFO.
```

## S18-SEQUENCEEQUAL-RIGHT-EXTRA

```text
Given Comparing and opposite stream already completed and has no unmatched value
When compareTo value
Then emit false, complete and release remaining subscriptions
And Closed unequal immediately.
```

## S18-SEQUENCEEQUAL-RIGHT-MATCH

```text
Given Comparing and opposite FIFO nonempty and strict equality holds against its oldest value
When compareTo value
Then discard one oldest opposite FIFO entry; no output
And Opposite FIFO shrinks by one while both completion flags remain unchanged.
```

## S18-SEQUENCEEQUAL-RIGHT-DIFFER

```text
Given Comparing and opposite FIFO nonempty and strict equality fails
When compareTo value
Then emit false then complete; release all live sources
And Closed unequal immediately.
```

## S18-SEQUENCEEQUAL-RIGHT-FIRST-COMPLETE

```text
Given Comparing and current side is live and the other side is not yet completed
When compareTo completed
Then release completed source subscription; retain unmatched FIFO
And Mark side completed and await the other stream.
```

## S18-SEQUENCEEQUAL-RIGHT-FINAL-EQUAL

```text
Given Comparing and opposite stream already completed; unmatched buffers both empty
When compareTo completed
Then emit true and complete
Then release final subscription
And Closed equal.
```

## S18-SEQUENCEEQUAL-RIGHT-FINAL-UNEVEN

```text
Given Comparing and opposite stream already completed; unmatched buffers not empty
When compareTo completed
Then emit false and complete
Then release final subscription
And Closed unequal.
```

## S18-SEQUENCEEQUAL-RIGHT-ERROR

```text
Given Comparing and current side is live
When compareTo error
Then forward exact error identity
Then release all live subscriptions
And Closed error.
```

## S18-SEQUENCEEQUAL-CANCEL

```text
Given Comparing and consumer cancels
When consumer cancels
Then release each still-live source without a boolean or completion
And Closed cancel.
```
