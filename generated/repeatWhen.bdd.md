# repeatWhen-persistent-notifier-post-setup: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S17-REPEATWHEN-START

```text
Given Unsubscribed and first downstream connection
When start source
Then subscribe source generation 0
And Active with no notifier.
```

## S17-REPEATWHEN-VALUE

```text
Given Active and source generation is current
When source value
Then forward source value unchanged
And Current generation and notifier state unchanged.
```

## S17-REPEATWHEN-FIRST-SOURCE-COMPLETE

```text
Given Active and current source completes, and notifier has never been constructed
When completed source generation
Then unsubscribe the completed source
Then subscribe to single notifier
Then emit void to completion Subject
And Waiting for first notifier next or terminal notification.
```

## S17-REPEATWHEN-SOURCE-COMPLETE-WAIT

```text
Given Active and current source completes and notifier is still open
When completed source generation
Then unsubscribe source
Then emit one void completion Subject signal
And Waiting with the notifier still open.
```

## S17-REPEATWHEN-SOURCE-COMPLETE-STOP

```text
Given Active and current source completes after notifier has completed
When completed source generation
Then unsubscribe final source
Then complete downstream
And Closed successfully; no source or notifier connection.
```

## S17-REPEATWHEN-RESTART

```text
Given Waiting and notifier is open and source has completed
When notifier trigger
Then subscribe one new source generation
And Active at next source generation.
```

## S17-REPEATWHEN-NOTIFIER-COMPLETE-WAIT

```text
Given Waiting and notifier completes with main source finished
When notifier terminal completion
Then unsubscribe notifier
Then complete downstream
And Closed successfully.
```

## S17-REPEATWHEN-NOTIFIER-COMPLETE-ACTIVE

```text
Given Active and notifier completes while restarted source is still active
When notifier terminal completion
Then release notifier without terminating current source
And Active with notifier completed.
```

## S17-REPEATWHEN-NOTIFIER-ERROR-ACTIVE

```text
Given Active and notifier is open
When notifier failure
Then forward exact notifier error
Then release all live resources
And Closed in error.
```

## S17-REPEATWHEN-CANCEL-ACTIVE

```text
Given Active and downstream cancellation
When consumer cancelled
Then dispose current source if active
Then dispose notifier if open
Then no terminal notification
And Closed by cancellation.
```

## S17-REPEATWHEN-NOTIFIER-ERROR-WAITING

```text
Given Waiting and notifier is open
When notifier failure
Then forward exact notifier error
Then release all live resources
And Closed in error.
```

## S17-REPEATWHEN-CANCEL-WAITING

```text
Given Waiting and downstream cancellation
When consumer cancelled
Then dispose current source if active
Then dispose notifier if open
Then no terminal notification
And Closed by cancellation.
```

## S17-REPEATWHEN-SOURCE-ERROR

```text
Given Active and current source generation fails
When source failure
Then error downstream immediately
Then release source and existing notifier
And Closed in error.
```
