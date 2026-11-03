# toArray-plain: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## AGG-TOARRAY-PLAIN-INIT

```text
Given Unsubscribed and fresh subscription
When a new result subscriber starts execution
Then connect source
Then initialize private accumulation
And Subscription allocates a fresh local aggregate; no seed or count value is emitted yet.
```

## AGG-TOARRAY-PLAIN-FIRST

```text
Given Collecting and no memory and a safe source index
When the source delivers one original value
Then remember original value, no output
And Without seed, the first source value becomes memory. It does not invoke a reducer or comparer.
```

## AGG-TOARRAY-PLAIN-PLAIN-COUNT

```text
Given Collecting and count without predicate; safe source index
When the source delivers one original value
Then increment private count; no output
And Count every source next; retain only the new count and source index. No value is emitted until completion.
```

## AGG-TOARRAY-PLAIN-APPEND

```text
Given Collecting and array profile; safe source index
When the source delivers one original value
Then remember one original reference in the ordered array; no output
And Keep a new immutable model snapshot of the values seen so far. Native toArray owns a mutable array, but emits only after completion.
```

## AGG-TOARRAY-PLAIN-CALL

```text
Given Collecting and memory exists and callback is required; safe index
When the source delivers one original value
Then invoke named callback with retained arguments
And Request exactly one callback, with the remembered value, incoming input and zero-based source index. No callback is run by the pure model.
```

## AGG-TOARRAY-PLAIN-RETURN

```text
Given Calling and matches pending callback identity
When the matching reducer/predicate/comparison returns
Then update aggregate from correlated callback outcome; no output
And Store the reducer result, add the predicate truthiness to count, or select the extremum based on comparison sign; still emit nothing.
```

## AGG-TOARRAY-PLAIN-THROW

```text
Given Calling and matches pending callback identity
When the matching reducer/predicate/comparison throws
Then notify error unchanged
Then unsubscribe source
And Callback failure forwards the exact thrown value, cancels upstream and discards the pending aggregate.
```

## AGG-TOARRAY-PLAIN-COMPLETE-SOME

```text
Given Collecting and aggregate memory is present
When the source completes successfully
Then notify final next
Then notify complete
Then unsubscribe source
And Only source completion emits the final aggregate once followed by completion, then releases the source.
```

## AGG-TOARRAY-PLAIN-COMPLETE-EMPTY

```text
Given Collecting and no seed and no source values
When the source completes successfully
Then notify complete
Then unsubscribe source
And Empty unseeded reduce and empty min/max complete without emitting a value.
```

## AGG-TOARRAY-PLAIN-ERROR

```text
Given Collecting and no unresolved callback
When the source fails
Then notify source error unchanged
Then unsubscribe source
And Source errors discard the aggregate and preserve the original error identity; no completion follows.
```

## AGG-TOARRAY-PLAIN-CANCEL

```text
Given Collecting and between resolved notifications
When the result subscriber unsubscribes
Then unsubscribe source without any terminal notification
And Unsubscription releases the upstream resource silently, without flushing the aggregate.
```
