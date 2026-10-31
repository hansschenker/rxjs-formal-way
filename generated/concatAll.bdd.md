# concatAll-1: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## CONCATALL-INIT

```text
Given Unsubscribed and fresh execution
When a fresh result subscription connects
Then subscribe to the outer source
And outer open with index zero and no active inners or queued values
```

## CONCATALL-ADMIT

```text
Given Active and a concurrency slot is available and the index can advance
When the outer source delivers a value
Then request one projection with the input and admission index
And one pending projection; index advanced once
```

## CONCATALL-QUEUE

```text
Given Active and all concurrency slots are occupied
When the outer source delivers a value
Then emit no action
And append the raw outer value to the FIFO queue without changing the projection index
```

## CONCATALL-RETURN-ACTIVE

```text
Given Calling and matching invocation with resume=Active; result is identical to pending inner source
When the pending projection returns a valid inner-source token
Then subscribe the returned source under the pending invocation generation
And new inner admitted; no outer value emitted directly
```

## CONCATALL-RETURN-DRAINING

```text
Given Calling and matching invocation with resume=Draining; result is identical to pending inner source
When the pending projection returns a valid inner-source token
Then subscribe the returned source under the pending invocation generation
And new inner admitted; no outer value emitted directly
```

## CONCATALL-NEXT-ACTIVE

```text
Given Active and the notification belongs to an active inner generation
When an admitted inner subscription delivers a value
Then forward the inner value unchanged
And retain the same active set and queue
```

## CONCATALL-INNER-ERROR-ACTIVE

```text
Given Active and the error belongs to an active inner generation
When an admitted inner subscription errors
Then error downstream unchanged
Then release all owned subscriptions and discard queued values
And closed by inner error
```

## CONCATALL-CANCEL-ACTIVE

```text
Given Active and between resolved reactions
When downstream unsubscribes
Then release the open outer and active inners; discard the queue without notifying downstream
And closed by cancellation
```

## CONCATALL-DRAIN-ACTIVE

```text
Given Active and matching inner; queue nonempty; projection index can advance
When an admitted inner subscription completes
Then release the completed inner
Then dequeue the oldest value and request its projection
And one slot reserved for the dequeued input; other inners remain active
```

## CONCATALL-INNER-END-ACTIVE

```text
Given Active and matching inner and empty queue
When an admitted inner subscription completes
Then release the completed inner
And remove that inner and keep waiting
```

## CONCATALL-NEXT-DRAINING

```text
Given Draining and the notification belongs to an active inner generation
When an admitted inner subscription delivers a value
Then forward the inner value unchanged
And retain the same active set and queue
```

## CONCATALL-INNER-ERROR-DRAINING

```text
Given Draining and the error belongs to an active inner generation
When an admitted inner subscription errors
Then error downstream unchanged
Then release all owned subscriptions and discard queued values
And closed by inner error
```

## CONCATALL-CANCEL-DRAINING

```text
Given Draining and between resolved reactions
When downstream unsubscribes
Then release the open outer and active inners; discard the queue without notifying downstream
And closed by cancellation
```

## CONCATALL-DRAIN-DRAINING

```text
Given Draining and matching inner; queue nonempty; projection index can advance
When an admitted inner subscription completes
Then release the completed inner
Then dequeue the oldest value and request its projection
And one slot reserved for the dequeued input; other inners remain active
```

## CONCATALL-LAST-INNER

```text
Given Draining and matching final inner and empty queue
When an admitted inner subscription completes
Then release the final inner
Then complete downstream
And closed by successful completion
```

## CONCATALL-OUTER-WAIT

```text
Given Active and at least one active inner
When the outer source completes
Then release the completed outer subscription
And outer done; preserve active inners and queued values
```

## CONCATALL-OUTER-END

```text
Given Active and no active inner and empty queue
When the outer source completes
Then complete downstream
Then release the outer subscription
And closed by successful completion
```

## CONCATALL-OUTER-ERROR

```text
Given Active and outer still open
When the outer source errors
Then error downstream unchanged
Then release the outer and active inners; discard the queue
And closed by outer error
```
