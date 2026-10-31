# shareReplay-2-6-0: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## SHAREREPLAY-CONNECT

```text
Given Disconnected and fresh subscription ID and available connection generation; environment clock must not move backwards
When a fresh subscriber joins; event carries an external clock reading
Then replay the nonexpired cached values in FIFO order before the terminal notification (if any)
Then subscribe to the source under a fresh connection generation
And one registered subscriber and one connection; replay memory retained, pruned or reset according to the event
```

## SHAREREPLAY-JOIN

```text
Given Connected and fresh subscription ID; environment clock must not move backwards
When a fresh subscriber joins; event carries an external clock reading
Then replay the nonexpired cached values in FIFO order before the terminal notification (if any)
And append subscriber to the existing connection, without replay; replay memory retained, pruned or reset according to the event
```

## SHAREREPLAY-NEXT

```text
Given Connected and current source generation; environment clock must not move backwards
When the current connection delivers a value; event carries an external clock reading
Then append incoming value to time/count-bounded replay memory
Then forward the value to each currently registered subscriber in registration order
And retain the connection and registry; replay memory retained, pruned or reset according to the event
```

## SHAREREPLAY-LEAVE

```text
Given Connected and registered subscriber and at least one other remains; environment clock must not move backwards
When a registered subscriber leaves; event carries an external clock reading
Then discard replay memory if connection resets
And remove only this subscriber; replay memory retained, pruned or reset according to the event
```

## SHAREREPLAY-LAST-RETAIN

```text
Given Connected and the last registered subscriber leaves; resetOnRefCountZero=false; environment clock must not move backwards
When a registered subscriber leaves; event carries an external clock reading
Then discard replay memory if connection resets
And keep the source connected with an empty subscriber registry; replay memory retained, pruned or reset according to the event
```

## SHAREREPLAY-COMPLETE-RETAIN

```text
Given Connected and current generation; resetOnComplete=false; environment clock must not move backwards
When the current connection completes; event carries an external clock reading
Then send complete to each current subscriber
Then release the source connection
And retain terminal status with no live connection or registered subscribers; replay memory retained, pruned or reset according to the event
```

## SHAREREPLAY-LATE-COMPLETE

```text
Given Completed and fresh subscription ID; retained terminal Subject; environment clock must not move backwards
When a fresh subscriber joins; event carries an external clock reading
Then replay the nonexpired cached values in FIFO order before the terminal notification (if any)
Then send the cached complete to this subscriber only
And remain terminated without connecting or retaining the new subscriber; replay memory retained, pruned or reset according to the event
```

## SHAREREPLAY-ERROR-RESET

```text
Given Connected and current generation; resetOnError=true; environment clock must not move backwards
When the current connection errors; event carries an external clock reading
Then discard replay memory if connection resets
Then send error to each current subscriber
Then release the source connection
And reset for a later fresh subscription; replay memory retained, pruned or reset according to the event
```
