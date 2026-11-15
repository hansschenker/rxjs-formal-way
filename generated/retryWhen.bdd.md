# retryWhen-persistent-errors-notifier: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S18-RETRYWHEN-START

```text
Given Unsubscribed and first result subscription
When start source
Then subscribe source generation 0
And Active with no notifier.
```

## S18-RETRYWHEN-FORWARD

```text
Given Active and current source generation sends a value
When source value
Then forward original payload exactly once
And Same current source and notifier state.
```

## S18-RETRYWHEN-FIRST-ERROR

```text
Given Active and matching source error and notifier absent
When source error to publish internally
Then release errored source
Then subscribe to persistent notifier
Then send original error to errors Subject
And Waiting for notifier next, complete or error.
```

## S18-RETRYWHEN-LATER-ERROR

```text
Given Active and matching source error and notifier already open
When source error to publish internally
Then release errored source
Then notify original error on existing Subject
And Waiting for the next notifier decision.
```

## S18-RETRYWHEN-RETRY

```text
Given Waiting and one notifier next while source is stopped
When start a new attempt
Then subscribe fresh source generation
And Active with next source generation; notifier remains open.
```

## S18-RETRYWHEN-NOTIFIER-COMPLETE-ACTIVE

```text
Given Active and open notifier completes
When complete result
Then complete downstream
Then release all live resources
And Closed successfully.
```

## S18-RETRYWHEN-NOTIFIER-ERROR-ACTIVE

```text
Given Active and open notifier errors
When fail result
Then forward exact notifier error
Then release active source and notifier
And Closed on notifier error.
```

## S18-RETRYWHEN-CANCEL-ACTIVE

```text
Given Active and consumer cancels
When cancel source and notifier
Then release source if live
Then release notifier if already allocated
Then no output notification
And Closed cancel.
```

## S18-RETRYWHEN-NOTIFIER-COMPLETE-WAITING

```text
Given Waiting and open notifier completes
When complete result
Then complete downstream
Then release all live resources
And Closed successfully.
```

## S18-RETRYWHEN-NOTIFIER-ERROR-WAITING

```text
Given Waiting and open notifier errors
When fail result
Then forward exact notifier error
Then release active source and notifier
And Closed on notifier error.
```

## S18-RETRYWHEN-CANCEL-WAITING

```text
Given Waiting and consumer cancels
When cancel source and notifier
Then release source if live
Then release notifier if already allocated
Then no output notification
And Closed cancel.
```

## S18-RETRYWHEN-SOURCE-COMPLETE

```text
Given Active and matching source generation completes
When successful source completion
Then complete downstream
Then release source and notifier if present
And Closed complete.
```
