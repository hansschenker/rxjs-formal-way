# withLatestFrom-2-tuple: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-22-LATEST-GATE.md) for complete histories and their test witnesses.

## S22-WITHLATESTFROM-START

```text
Given Unsubscribed and no subscription exists
When First connection to this result execution.
Then subscribe to each auxiliary Observable in argument order
Then subscribe source last
And All readiness bits start false; no result is emitted until every auxiliary has a value.
```

## S22-WITHLATESTFROM-AUX-NEXT

```text
Given Active and addressed auxiliary remains subscribed
When One auxiliary emits an opaque latest value.
Then update latest auxiliary value and first-value presence bit, emit nothing
And Readiness changes only when all auxiliaries have emitted at least once.
```

## S22-WITHLATESTFROM-AUX-COMPLETE

```text
Given Active and addressed auxiliary remains subscribed
When One auxiliary stops without terminating result.
Then release completed auxiliary input only
And The last value/presence bit is retained; empty completion can permanently block readiness.
```

## S22-WITHLATESTFROM-AUX-ERROR

```text
Given Active and addressed auxiliary remains subscribed
When One auxiliary fails and terminates result.
Then error downstream with identical payload
Then cancel source and other live auxiliaries
And Result terminates; no source value can recover auxiliary failure.
```

## S22-WITHLATESTFROM-SOURCE-BLOCKED

```text
Given Active and at least one auxiliary has not yet produced a value
When A value from the currently owned source subscription.
Then drop the source value; do not enqueue it for later replay
And Latest ancillary values may still change but there is no source-triggered output.
```

## S22-WITHLATESTFROM-SOURCE-READY

```text
Given Active and every auxiliary has previously produced at least one value
When A value from the currently owned source subscription.
Then emit a fresh tuple containing current source value and latest ancillary values
And Auxiliary memory remains unchanged until another auxiliary next.
```

## S22-WITHLATESTFROM-SOURCE-COMPLETE

```text
Given Active and source completes regardless of readiness
When Successful source termination.
Then complete downstream
Then release source and any remaining auxiliaries
And Closed without a final snapshot or synthetic tuple.
```

## S22-WITHLATESTFROM-SOURCE-ERROR

```text
Given Active and source fails
When Source failure with an opaque error value.
Then error downstream with same error
Then release source and live auxiliaries
And Closed without retries or output tuples.
```

## S22-WITHLATESTFROM-CANCEL

```text
Given Active and outer downstream closes its connection
When Consumer closes the result connection silently.
Then release source and all live auxiliaries, emit nothing
And Closed; no retained latest values after teardown.
```
