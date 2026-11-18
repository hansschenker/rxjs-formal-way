# throttleTime-11-4: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-20-SCENARIOS.md) for complete histories and their test witnesses.

## S20-THROTTLETIME-START

```text
Given Unsubscribed and first result connection; valid nondecreasing supplied time
When First connection to this result execution.
Then subscribe source; create no duration yet
And Open with empty pending memory and next duration generation zero.
```

## S20-THROTTLETIME-OPEN-NEXT

```text
Given Open and no active duration; leading=true; valid nondecreasing supplied time
When A value from the currently owned source subscription.
Then clear pending presence and emit the incoming value
Then schedule the next duration action
And Duration generation advances; pending memory is empty after leading output.
```

## S20-THROTTLETIME-REMEMBER

```text
Given Throttled and a duration is active; valid nondecreasing supplied time
When A value from the currently owned source subscription.
Then replace pending value without restarting duration or emitting
And Same duration generation/deadline; pending presence=true with newest payload.
```

## S20-THROTTLETIME-END-EMIT-RESTART

```text
Given Throttled and current duration ends with a pending value and trailing=true; valid nondecreasing supplied time
When Current scheduled duration action executes at supplied now.
Then release current duration
Then clear pending presence and emit latest value
Then schedule a fresh duration
And Pending memory is empty; a new duration generation starts while source remains live.
```

## S20-THROTTLETIME-END-OPEN

```text
Given Throttled and current duration ends without a pending value; valid nondecreasing supplied time
When Current scheduled duration action executes at supplied now.
Then release current duration; emit nothing
And Open with no active duration; preserve any un-emitted internal memory until replaced.
```

## S20-THROTTLETIME-COMPLETE-OPEN

```text
Given Open and source completes with no active duration; valid nondecreasing supplied time
When Successful source termination.
Then complete result without flushing retained value
Then release source
And Closed complete; all pending memory discarded.
```

## S20-THROTTLETIME-COMPLETE-WAIT

```text
Given Throttled and trailing=true and a value is pending behind a live duration; valid nondecreasing supplied time
When Successful source termination.
Then release completed source; keep duration live
And Waiting with source closed, one duration owned and latest value retained.
```

## S20-THROTTLETIME-WAIT-END

```text
Given Waiting and current duration ends after source completion; valid nondecreasing supplied time
When Current scheduled duration action executes at supplied now.
Then release current duration
Then emit the retained trailing value
Then complete result; do not start another duration
And Closed complete; source was already released, duration and memory are now gone.
```

## S20-THROTTLETIME-COMPLETE-NOW

```text
Given Throttled and there is no pending value; valid nondecreasing supplied time
When Successful source termination.
Then complete result immediately
Then release source
Then release active duration
And Closed complete; no pending value is emitted.
```

## S20-THROTTLETIME-SOURCE-ERROR-OPEN

```text
Given Open and source fails; valid nondecreasing supplied time
When Source failure with an opaque error value.
Then forward exact source error
Then release source and any active duration without flushing
And Closed error; pending value discarded.
```

## S20-THROTTLETIME-SOURCE-ERROR-THROTTLED

```text
Given Throttled and source fails; valid nondecreasing supplied time
When Source failure with an opaque error value.
Then forward exact source error
Then release source and any active duration without flushing
And Closed error; pending value discarded.
```

## S20-THROTTLETIME-CANCEL-OPEN

```text
Given Open and consumer cancels this execution; valid nondecreasing supplied time
When Consumer closes the result connection silently.
Then release only still-owned source/duration resources; emit nothing
And Closed cancel; clear all memory.
```

## S20-THROTTLETIME-CANCEL-THROTTLED

```text
Given Throttled and consumer cancels this execution; valid nondecreasing supplied time
When Consumer closes the result connection silently.
Then release only still-owned source/duration resources; emit nothing
And Closed cancel; clear all memory.
```

## S20-THROTTLETIME-CANCEL-WAITING

```text
Given Waiting and consumer cancels this execution; valid nondecreasing supplied time
When Consumer closes the result connection silently.
Then release only still-owned source/duration resources; emit nothing
And Closed cancel; clear all memory.
```
