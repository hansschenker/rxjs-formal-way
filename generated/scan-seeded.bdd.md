# scan-seeded-accumulator: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## SCAN-INIT-SEEDED

```text
Given Unsubscribed and fresh execution
When a fresh execution subscribes
Then subscribe to the source without emitting a value or invoking the reducer
And active with the seed reference and index zero
```

## SCAN-CALL

```text
Given Active and index < Number.MAX_SAFE_INTEGER
When the source delivers a value
Then request one reducer call with the previous accumulation, incoming value and current source index
And calling with prior accumulation and input retained; next index increased by one
```

## SCAN-RETURN

```text
Given Calling and outcome identifies the pending invocation
When the pending reducer returns a result
Then emit the returned accumulation once
And active with the returned accumulation and the already advanced index
```

## SCAN-THROW

```text
Given Calling and outcome identifies the pending invocation
When the pending reducer throws
Then forward the thrown error unchanged
Then release the source subscription
And closed because the reducer threw
```

## SCAN-ACTIVE-COMPLETE

```text
Given Active and no pending reducer
When the source completes
Then complete downstream without another value
Then release the source subscription
And closed because the source completed
```

## SCAN-ACTIVE-ERROR

```text
Given Active and no pending reducer
When the source errors
Then forward the source error unchanged
Then release the source subscription
And closed because the source errored
```

## SCAN-ACTIVE-CANCEL

```text
Given Active and between resolved value reactions
When downstream unsubscribes
Then release the source subscription without notifying downstream
And closed because downstream cancelled
```
