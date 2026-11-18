# timeoutWith-first-absolute-5-each-none-constant: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-21-SCENARIOS.md) for complete histories and their test witnesses.

## S21-TIMEOUTWITH-START

```text
Given Unsubscribed and first connection; initial deadline remains future and representable; supplied time is a nondecreasing safe integer
When First connection to this result execution.
Then subscribe source
Then schedule initial watchdog
And Source with seen=0, lastValue=null and timer generation zero.
```

## S21-TIMEOUTWITH-NEXT-CANCEL-TIMER

```text
Given Source and a current timer is active; supplied time is a nondecreasing safe integer
When A value from the currently owned source subscription.
Then cancel current timer before delivery
Then forward exact source value
And Seen advances and no watchdog remains after the first value.
```

## S21-TIMEOUTWITH-NEXT-UNARMED

```text
Given Source and first-only watchdog was already satisfied; supplied time is a nondecreasing safe integer
When A value from the currently owned source subscription.
Then forward exact source value
And Seen advances and no watchdog remains after the first value.
```

## S21-TIMEOUTWITH-SOURCE-COMPLETE

```text
Given Source and source completes before watchdog delivery; supplied time is a nondecreasing safe integer
When Successful source termination.
Then complete result
Then release source
Then cancel any current timer
And Closed complete; no fallback acquisition.
```

## S21-TIMEOUTWITH-SOURCE-ERROR

```text
Given Source and source fails before watchdog delivery; supplied time is a nondecreasing safe integer
When Source failure with an opaque error value.
Then forward exact source error
Then release source
Then cancel any current timer
And Closed error; no factory or fallback.
```

## S21-TIMEOUTWITH-CANCEL-SOURCE

```text
Given Source and consumer closes while source owns the connection; supplied time is a nondecreasing safe integer
When Consumer closes the result connection silently.
Then release source
Then cancel any current timer; emit nothing
And Closed cancel; no timeout factory or fallback.
```

## S21-TIMEOUTWITH-EXPIRE

```text
Given Source and current timer generation fires at or after its deadline; supplied time is a nondecreasing safe integer
When Current watchdog action executes at supplied now.
Then release original source
Then cancel current timer during source finalization
Then subscribe configured fallback Observable
And Fallback owns the result; the source and all watchdogs are released.
```

## S21-TIMEOUTWITH-FALLBACK-NEXT

```text
Given Fallback and notification belongs to the live fallback generation; supplied time is a nondecreasing safe integer
When Current replacement emits a value.
Then forward exact fallback value without scheduling
And Same fallback token; source stays disconnected.
```

## S21-TIMEOUTWITH-FALLBACK-COMPLETE

```text
Given Fallback and notification belongs to live fallback; supplied time is a nondecreasing safe integer
When Current replacement completes.
Then complete result
Then release fallback
And Closed complete; no source or timer exists.
```

## S21-TIMEOUTWITH-FALLBACK-ERROR

```text
Given Fallback and notification belongs to live fallback; supplied time is a nondecreasing safe integer
When Current replacement fails.
Then forward exact fallback error
Then release fallback
And Closed error; no source or timer exists.
```

## S21-TIMEOUTWITH-CANCEL-FALLBACK

```text
Given Fallback and consumer closes the replacement connection; supplied time is a nondecreasing safe integer
When Consumer closes the result connection silently.
Then release fallback silently
And Closed cancel; do not release original source twice.
```
