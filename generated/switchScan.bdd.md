# switchScan-latest-inner-seed: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## SWITCHSCAN-INIT

```text
Given Unsubscribed and fresh execution
When a fresh result subscription connects
Then subscribe to the outer source
And outer open with index zero and no active inners or queued values
```

## SWITCHSCAN-ADMIT

```text
Given Active and a concurrency slot is available and the index can advance
When the outer source delivers a value
Then request one projection with the input and admission index
And one pending projection; index advanced once
```

## SWITCHSCAN-REPLACE

```text
Given Active and an inner is active and the index can advance
When the outer source delivers a value
Then unsubscribe the previous inner
Then request the new projection
And previous inner removed before the new projection
```

## SWITCHSCAN-RETURN-ACTIVE

```text
Given Calling and matching invocation with resume=Active
When the pending projection returns a valid inner-source token
Then subscribe the returned source under the pending invocation generation
And new inner admitted; no outer value emitted directly
```

## SWITCHSCAN-THROW

```text
Given Calling and matching projection invocation
When the pending projection throws
Then error downstream with the thrown value
Then release the open outer and every remaining inner; discard the queue
And closed by projection error
```

## SWITCHSCAN-NEXT-ACTIVE

```text
Given Active and the notification belongs to an active inner generation
When an admitted inner subscription delivers a value
Then forward the inner value unchanged
And retain the same active set and queue
```

## SWITCHSCAN-INNER-ERROR-ACTIVE

```text
Given Active and the error belongs to an active inner generation
When an admitted inner subscription errors
Then error downstream unchanged
Then release all owned subscriptions and discard queued values
And closed by inner error
```

## SWITCHSCAN-CANCEL-ACTIVE

```text
Given Active and between resolved reactions
When downstream unsubscribes
Then release the open outer and active inners; discard the queue without notifying downstream
And closed by cancellation
```

## SWITCHSCAN-INNER-END-ACTIVE

```text
Given Active and matching inner and empty queue
When an admitted inner subscription completes
Then release the completed inner
And remove that inner and keep waiting
```

## SWITCHSCAN-NEXT-DRAINING

```text
Given Draining and the notification belongs to an active inner generation
When an admitted inner subscription delivers a value
Then forward the inner value unchanged
And retain the same active set and queue
```

## SWITCHSCAN-INNER-ERROR-DRAINING

```text
Given Draining and the error belongs to an active inner generation
When an admitted inner subscription errors
Then error downstream unchanged
Then release all owned subscriptions and discard queued values
And closed by inner error
```

## SWITCHSCAN-CANCEL-DRAINING

```text
Given Draining and between resolved reactions
When downstream unsubscribes
Then release the open outer and active inners; discard the queue without notifying downstream
And closed by cancellation
```

## SWITCHSCAN-LAST-INNER

```text
Given Draining and matching final inner and empty queue
When an admitted inner subscription completes
Then complete downstream
Then release the final inner
And closed by successful completion
```

## SWITCHSCAN-OUTER-WAIT

```text
Given Active and at least one active inner
When the outer source completes
Then release the completed outer subscription
And outer done; preserve active inners and queued values
```

## SWITCHSCAN-OUTER-END

```text
Given Active and no active inner and empty queue
When the outer source completes
Then complete downstream
Then release the outer subscription
And closed by successful completion
```

## SWITCHSCAN-OUTER-ERROR

```text
Given Active and outer still open
When the outer source errors
Then error downstream unchanged
Then release the outer and active inners; discard the queue
And closed by outer error
```
