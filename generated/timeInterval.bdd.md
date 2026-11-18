# timeInterval-external-clock: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-21-SCENARIOS.md) for complete histories and their test witnesses.

## S21-TIMEINTERVAL-START-READ

```text
Given Unsubscribed and first result connection
When First connection to this result execution.
Then request scheduler.now before source acquisition
And ReadingStart for read zero; no source subscription exists yet.
```

## S21-TIMEINTERVAL-START-RETURN

```text
Given ReadingStart and matching initial read returns a finite number
When Finite value returned by the currently pending synchronous provider read.
Then subscribe source
And Listening with previous=reading and nextRead=1.
```

## S21-TIMEINTERVAL-START-THROW

```text
Given ReadingStart and matching initial read throws
When Opaque error thrown by the currently pending synchronous provider read.
Then forward exact provider error without acquiring source
And Closed error; no source resource requires release.
```

## S21-TIMEINTERVAL-NEXT-READ

```text
Given Listening and source is live and next read index can advance safely
When A value from the currently owned source subscription.
Then retain exact value and request provider.now
And ReadingNext with the source value and correlated read index retained.
```

## S21-TIMEINTERVAL-NEXT-RETURN

```text
Given ReadingNext and matching read is finite and reading minus previous remains finite
When Finite value returned by the currently pending synchronous provider read.
Then emit a fresh record containing the same value and reading minus previous
And Listening with previous replaced by this reading and nextRead advanced.
```

## S21-TIMEINTERVAL-NEXT-THROW

```text
Given ReadingNext and matching next-value read throws
When Opaque error thrown by the currently pending synchronous provider read.
Then forward exact provider error
Then release source without forwarding pending value
And Closed error; pending value and baseline are discarded.
```

## S21-TIMEINTERVAL-COMPLETE

```text
Given Listening and source completes while no read is pending
When Successful source termination.
Then complete downstream
Then release source; perform no clock read
And Closed complete with no retained memory.
```

## S21-TIMEINTERVAL-ERROR

```text
Given Listening and source fails while no read is pending
When Source failure with an opaque error value.
Then forward exact source error
Then release source; perform no clock read
And Closed error with no retained memory.
```

## S21-TIMEINTERVAL-CANCEL

```text
Given Listening and consumer cancels between source reactions
When Consumer closes the result connection silently.
Then release source silently; perform no clock read
And Closed cancel; memory discarded.
```
