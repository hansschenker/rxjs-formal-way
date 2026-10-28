# map-project: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## MAP-INIT

```text
Given Unsubscribed and fresh execution
When a fresh downstream execution subscribes
Then subscribe to the source without invoking the callback
And active with callback index zero
```

## MAP-CALL

```text
Given Active and index < Number.MAX_SAFE_INTEGER
When the source delivers a value
Then request exactly one callback invocation with the incoming value and the current zero-based index
And calling with the input retained and the next index increased by one
```

## MAP-RETURN

```text
Given Calling and outcome identifies the pending invocation
When the pending callback returns a result
Then forward the returned result as one value
And active with the next callback index
```

## MAP-THROW

```text
Given Calling and outcome identifies the pending invocation
When the pending callback throws
Then forward the thrown error unchanged
Then release the source subscription
And closed because the callback threw
```

## MAP-COMPLETE

```text
Given Active and no unresolved callback
When the source completes
Then complete downstream
Then release the source subscription
And closed because the source completed
```

## MAP-ERROR

```text
Given Active and no unresolved callback
When the source errors
Then forward the source error unchanged
Then release the source subscription
And closed because the source errored
```

## MAP-CANCEL

```text
Given Active and between resolved value reactions
When downstream unsubscribes
Then release the source subscription without notifying downstream
And closed because downstream cancelled
```
