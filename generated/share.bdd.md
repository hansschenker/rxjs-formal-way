# share-111: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## SHARE-CONNECT

```text
Given Disconnected and fresh subscription ID and available connection generation
When a fresh subscriber joins
Then subscribe to the source under a fresh connection generation
And one registered subscriber and one connection
```

## SHARE-JOIN

```text
Given Connected and fresh subscription ID
When a fresh subscriber joins
Then emit no action
And append subscriber to the existing connection, without replay
```

## SHARE-NEXT

```text
Given Connected and current source generation
When the current connection delivers a value
Then forward the value to each currently registered subscriber in registration order
And retain the connection and registry
```

## SHARE-LEAVE

```text
Given Connected and registered subscriber and at least one other remains
When a registered subscriber leaves
Then emit no action
And remove only this subscriber
```

## SHARE-LAST-RESET

```text
Given Connected and the last registered subscriber leaves; resetOnRefCountZero=true
When a registered subscriber leaves
Then unsubscribe the source
And reset the connection with no live subscribers
```

## SHARE-COMPLETE-RESET

```text
Given Connected and current generation; resetOnComplete=true
When the current connection completes
Then send complete to each current subscriber
Then release the source connection
And reset for a later fresh subscription
```

## SHARE-ERROR-RESET

```text
Given Connected and current generation; resetOnError=true
When the current connection errors
Then send error to each current subscriber
Then release the source connection
And reset for a later fresh subscription
```
