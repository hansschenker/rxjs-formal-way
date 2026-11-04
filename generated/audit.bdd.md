# audit-Observable-duration: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## AUDIT-INIT

```text
Given Unsubscribed and fresh valid clock
When acquire a source subscription
Then subscribe to the source
And idle without a duration
```

## AUDIT-START

```text
Given Idle and valid clock, fresh generation and duration deadline
When start or update a latest-value window
Then invoke durationSelector exactly once with this value
And await the correlated duration-selector outcome
```

## AUDIT-REPLACE

```text
Given Pending and duration remains active
When start or update a latest-value window
Then emit no action
And same duration with latest input replaced
```

## AUDIT-COMPLETE-IDLE

```text
Given Idle and no active duration
When complete when no duration remains, else wait
Then complete downstream
Then release source
And closed by completion
```

## AUDIT-COMPLETE-PENDING

```text
Given Pending and duration active
When complete when no duration remains, else wait
Then release completed source; retain duration
And waiting for duration outcome, no new source values
```

## AUDIT-CALL-RETURN

```text
Given Calling and matching selector invocation
When duration selector returned a valid Observable
Then subscribe to returned duration Observable
And pending with a duration subscription
```

## AUDIT-CALL-THROW

```text
Given Calling and matching selector invocation
When duration selector threw
Then forward thrown value
Then release source
And closed by selector error
```

## AUDIT-DURATION-NEXT

```text
Given Pending and matching live duration next
When active duration emits a next signal
Then release active duration
Then emit latest pending source value
And idle and ready for the next source value
```

## AUDIT-DURATION-COMPLETE

```text
Given Pending and matching duration completion without next
When active duration completes without next
Then release ended duration without emitting a pending value
And idle; next source value can start a new duration
```

## AUDIT-DURATION-ERROR

```text
Given Pending and matching live duration error
When active duration errors
Then forward duration error
Then release owned resources
And closed by duration error
```

## AUDIT-WAITING-DURATION-NEXT

```text
Given Waiting and matching live duration next
When active duration emits a next signal
Then release active duration
Then emit latest pending source value
Then complete downstream
And closed by delayed completion
```

## AUDIT-WAITING-DURATION-COMPLETE

```text
Given Waiting and matching duration completion without next
When active duration completes without next
Then release ended duration without emitting a pending value
Then complete downstream
And closed without a flush
```

## AUDIT-WAITING-DURATION-ERROR

```text
Given Waiting and matching live duration error
When active duration errors
Then forward duration error
Then release owned resources
And closed by duration error
```

## AUDIT-SOURCE-ERROR-IDLE

```text
Given Idle and valid clock and live execution
When error without flushing
Then forward error unchanged
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```

## AUDIT-CANCEL-IDLE

```text
Given Idle and valid clock and live execution
When stop silently and release resources
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```

## AUDIT-SOURCE-ERROR-CALLING

```text
Given Calling and valid clock and live execution
When error without flushing
Then forward error unchanged
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```

## AUDIT-CANCEL-CALLING

```text
Given Calling and valid clock and live execution
When stop silently and release resources
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```

## AUDIT-SOURCE-ERROR-PENDING

```text
Given Pending and valid clock and live execution
When error without flushing
Then forward error unchanged
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```

## AUDIT-CANCEL-PENDING

```text
Given Pending and valid clock and live execution
When stop silently and release resources
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```

## AUDIT-CANCEL-WAITING

```text
Given Waiting and valid clock and live execution
When stop silently and release resources
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```
