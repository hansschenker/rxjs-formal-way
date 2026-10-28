# take-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## TAKE-INIT-ZERO

```text
Given Unsubscribed and count = 0
When a fresh downstream execution subscribes
Then complete downstream without subscribing to the source
And closed because the quota is zero
```

## TAKE-INIT-POSITIVE

```text
Given Unsubscribed and count > 0
When a fresh downstream execution subscribes
Then subscribe to the source
And active with seen = 0
```

## TAKE-NEXT-PASS

```text
Given Active and seen + 1 < count
When the source delivers a value
Then forward the incoming value unchanged
And active with seen increased by one
```

## TAKE-NEXT-LAST

```text
Given Active and seen + 1 = count
When the source delivers a value
Then forward the incoming value unchanged
Then complete downstream
Then release the source subscription
And closed because the quota was reached
```

## TAKE-SOURCE-COMPLETE

```text
Given Active and source completes before the quota
When the source completes
Then complete downstream
Then release the source subscription
And closed because the source completed
```

## TAKE-SOURCE-ERROR

```text
Given Active and source errors before the quota
When the source errors
Then forward the source error unchanged
Then release the source subscription
And closed because the source errored
```

## TAKE-CANCEL

```text
Given Active and downstream cancels before termination
When downstream unsubscribes
Then release the source subscription without notifying downstream
And closed because downstream cancelled
```
