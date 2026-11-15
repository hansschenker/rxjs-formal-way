# refCount-publish-Subject-legacy: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S18-REFCOUNT-CONNECT

```text
Given Disconnected and fresh subscription ID and available connection generation
When a fresh subscriber joins
Then subscribe to the source under a fresh connection generation
And one registered subscriber and one connection
```

## S18-REFCOUNT-JOIN

```text
Given Connected and fresh subscription ID
When a fresh subscriber joins
Then emit no action
And append subscriber to the existing connection, without replay
```

## S18-REFCOUNT-NEXT

```text
Given Connected and current source generation
When the current connection delivers a value
Then forward the value to each currently registered subscriber in registration order
And retain the connection and registry
```

## S18-REFCOUNT-LEAVE

```text
Given Connected and registered subscriber and at least one other remains
When a registered subscriber leaves
Then emit no action
And remove only this subscriber
```

## S18-REFCOUNT-LAST-RESET

```text
Given Connected and the last registered subscriber leaves; resetOnRefCountZero=true
When a registered subscriber leaves
Then unsubscribe the source
And reset the connection with no live subscribers
```

## S18-REFCOUNT-COMPLETE-RETAIN

```text
Given Connected and current generation; resetOnComplete=false
When the current connection completes
Then send complete to each current subscriber
Then release the source connection
And retain terminal status with no live connection or registered subscribers
```

## S18-REFCOUNT-LATE-COMPLETE

```text
Given Completed and fresh subscription ID; retained terminal Subject
When a fresh subscriber joins
Then send the cached complete to this subscriber only
And remain terminated without connecting or retaining the new subscriber
```

## S18-REFCOUNT-ERROR-RETAIN

```text
Given Connected and current generation; resetOnError=false
When the current connection errors
Then send error to each current subscriber
Then release the source connection
And retain terminal status with no live connection or registered subscribers
```

## S18-REFCOUNT-LATE-ERROR

```text
Given Errored and fresh subscription ID; retained terminal Subject
When a fresh subscriber joins
Then send the cached error to this subscriber only
And remain terminated without connecting or retaining the new subscriber
```
