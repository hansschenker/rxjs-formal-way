# timeout-first-none-each-4-default: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-21-SCENARIOS.md) for complete histories and their test witnesses.

## S21-TIMEOUT-START

```text
Given Unsubscribed and first connection; initial deadline remains future and representable; supplied time is a nondecreasing safe integer
When First connection to this result execution.
Then subscribe source
Then schedule initial watchdog
And Source with seen=0, lastValue=null and timer generation zero.
```

## S21-TIMEOUT-NEXT-CANCEL-TIMER

```text
Given Source and a current timer is active; supplied time is a nondecreasing safe integer
When A value from the currently owned source subscription.
Then cancel current timer before delivery
Then forward exact source value
Then schedule fresh each watchdog
And Seen advances, lastValue becomes input, and the fresh timer uses now+each.
```

## S21-TIMEOUT-SOURCE-COMPLETE

```text
Given Source and source completes before watchdog delivery; supplied time is a nondecreasing safe integer
When Successful source termination.
Then complete result
Then release source
Then cancel any current timer
And Closed complete; no fallback acquisition.
```

## S21-TIMEOUT-SOURCE-ERROR

```text
Given Source and source fails before watchdog delivery; supplied time is a nondecreasing safe integer
When Source failure with an opaque error value.
Then forward exact source error
Then release source
Then cancel any current timer
And Closed error; no factory or fallback.
```

## S21-TIMEOUT-CANCEL-SOURCE

```text
Given Source and consumer closes while source owns the connection; supplied time is a nondecreasing safe integer
When Consumer closes the result connection silently.
Then release source
Then cancel any current timer; emit nothing
And Closed cancel; no timeout factory or fallback.
```

## S21-TIMEOUT-EXPIRE

```text
Given Source and current timer generation fires at or after its deadline; supplied time is a nondecreasing safe integer
When Current watchdog action executes at supplied now.
Then release original source
Then cancel current timer during source finalization
Then invoke timeout factory with meta, seen and cleared lastValue
And Choosing awaits one same-time correlated factory outcome; no source/timer remains.
```

## S21-TIMEOUT-FACTORY-THROW

```text
Given Choosing and matching factory throws at invocation time; supplied time is a nondecreasing safe integer
When Throw from the currently pending, correlated synchronous callback.
Then forward exact thrown error
And Closed error; original source and timer were already released.
```
