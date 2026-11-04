# auditTime-3: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## AUDITTIME-INIT

```text
Given Unsubscribed and fresh valid clock
When acquire a source subscription
Then subscribe to the source
And idle without a duration
```

## AUDITTIME-START

```text
Given Idle and valid clock, fresh generation and duration deadline
When start or update a latest-value window
Then schedule one timer; retain the input
And pending with one scheduled duration and latest value
```

## AUDITTIME-REPLACE

```text
Given Pending and duration remains active
When start or update a latest-value window
Then emit no action
And same duration with latest input replaced
```

## AUDITTIME-COMPLETE-IDLE

```text
Given Idle and no active duration
When complete when no duration remains, else wait
Then complete downstream
Then release source
And closed by completion
```

## AUDITTIME-COMPLETE-PENDING

```text
Given Pending and duration active
When complete when no duration remains, else wait
Then release completed source; retain duration
And waiting for duration outcome, no new source values
```

## AUDITTIME-DURATION-NEXT

```text
Given Pending and matching timer identity at or after deadline
When the active scheduled window expires
Then release active duration
Then emit latest pending source value
And idle and ready for the next source value
```

## AUDITTIME-WAITING-DURATION-NEXT

```text
Given Waiting and matching timer identity at or after deadline
When the active scheduled window expires
Then release active duration
Then emit latest pending source value
Then complete downstream
And closed by delayed completion
```

## AUDITTIME-SOURCE-ERROR-IDLE

```text
Given Idle and valid clock and live execution
When error without flushing
Then forward error unchanged
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```

## AUDITTIME-CANCEL-IDLE

```text
Given Idle and valid clock and live execution
When stop silently and release resources
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```

## AUDITTIME-SOURCE-ERROR-PENDING

```text
Given Pending and valid clock and live execution
When error without flushing
Then forward error unchanged
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```

## AUDITTIME-CANCEL-PENDING

```text
Given Pending and valid clock and live execution
When stop silently and release resources
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```

## AUDITTIME-CANCEL-WAITING

```text
Given Waiting and valid clock and live execution
When stop silently and release resources
Then release owned subscriptions/timer without flush
And closed with pending value discarded
```
