# publish-legacy-fixed-subject: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S16-PUBLISH-JOIN-READY

```text
Given Ready and new nonnegative observer id
When attach an addressed Subject consumer
Then register subscriber
Then synchronously replay variant-specific current memory
And Existing connection and all previous subscriber registrations remain.
```

## S16-PUBLISH-LEAVE-READY

```text
Given Ready and observer is registered
When remove only one consumer
Then unsubscribe only that observer, not the source connection
And The Subject remains live; other observers and the source are unaffected.
```

## S16-PUBLISH-JOIN-CONNECTED

```text
Given Connected and new nonnegative observer id
When attach an addressed Subject consumer
Then register subscriber
Then synchronously replay variant-specific current memory
And Existing connection and all previous subscriber registrations remain.
```

## S16-PUBLISH-LEAVE-CONNECTED

```text
Given Connected and observer is registered
When remove only one consumer
Then unsubscribe only that observer, not the source connection
And The Subject remains live; other observers and the source are unaffected.
```

## S16-PUBLISH-CONNECT

```text
Given Ready and no active upstream source connection
When explicit source connection
Then acquire one source subscription
And Connected; source subscription generation owned by this connectable object.
```

## S16-PUBLISH-CONNECT-IDEMPOTENT

```text
Given Connected and connection already live
When explicit source connection
Then return existing connection, no new subscribe
And Same source generation and observer set.
```

## S16-PUBLISH-DISCONNECT

```text
Given Connected and explicit upstream connection cancellation
When explicit upstream connection cancellation
Then unsubscribe only the source connection, never complete subject observers
And Ready for a further manual connection; source generation advances.
```

## S16-PUBLISH-SOURCE-NEXT

```text
Given Connected and notification from current source generation
When current connected source value
Then update Subject memory according to connector
Then forward immediately except AsyncSubject publishLast
And Connected with variant-specific memory and unchanged subscriber ownership.
```

## S16-PUBLISH-SOURCE-COMPLETE

```text
Given Connected and current source completed
When source successful terminal
Then disconnect source
Then AsyncSubject emits last value if present
Then complete all current consumers
And Stopped successfully; no subscribed observers or upstream connection.
```

## S16-PUBLISH-SOURCE-ERROR

```text
Given Connected and current source fails
When source failure
Then disconnect source
Then error every current consumer with same object
And Stopped in error with unchanged ReplaySubject cache; no observers.
```

## S16-PUBLISH-LATE-SUBSCRIBE

```text
Given Stopped and new nonnegative observer id
When attach an addressed Subject consumer
Then deliver terminal retained memory allowed by the Subject subtype
Then deliver terminal notification
And Stopped; subscriber is not retained and source is never re-acquired.
```
