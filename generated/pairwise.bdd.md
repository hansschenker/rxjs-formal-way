# pairwise-reference: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## PAIRWISE-INIT

```text
Given Unsubscribed and new execution
When new downstream subscription
Then subscribe source; no previous value yet
And active with no previous item
```

## PAIRWISE-FIRST

```text
Given Active and no previous source value
When source emits another item
Then remember the first source value without emitting
And active remembering the first value
```

## PAIRWISE-NEXT

```text
Given Active and previous value remembered
When source emits another item
Then store current value before emitting [previous, current]
And active remembering the current value
```

## PAIRWISE-COMPLETE

```text
Given Active and source finishes with any number of values
When source completes
Then forward completion without flushing an incomplete pair
Then release source
And closed after completion
```

## PAIRWISE-ERROR

```text
Given Active and source errors
When source errors
Then forward the original error
Then release source
And closed after error
```

## PAIRWISE-CANCEL

```text
Given Active and downstream unsubscribes
When downstream unsubscribes
Then release source without completion
And closed by cancellation
```
