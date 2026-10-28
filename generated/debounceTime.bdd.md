# debounceTime-3: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## DEBOUNCE-INIT

```text
Given Unsubscribed and fresh execution and valid clock
When a fresh downstream execution subscribes
Then subscribe to the source; schedule no timer
And idle with no pending value and timer generation zero
```

## DEBOUNCE-START

```text
Given Idle and valid clock/deadline and a fresh timer identity is available
When the source delivers a value at the supplied clock time
Then schedule a timer invocation after dueTime; emit no value
And pending with the incoming value, its time, deadline and scheduled wake-up
```

## DEBOUNCE-REPLACE

```text
Given Pending and valid nondecreasing clock and representable deadline
When the source delivers a value at the supplied clock time
Then emit no action
And pending with the latest value and deadline, retaining the already scheduled invocation
```

## DEBOUNCE-REARM

```text
Given Pending and matching due invocation; now < latest deadline; fresh identity available
When the currently scheduled invocation fires at the supplied clock time
Then schedule a new invocation for deadline minus now; emit no value
And pending with the same value and deadline and a new scheduled-invocation generation
```

## DEBOUNCE-EMIT

```text
Given Pending and matching due invocation; now >= latest deadline
When the currently scheduled invocation fires at the supplied clock time
Then release the active timer task
Then emit the pending value unchanged
And idle with no pending value or active timer
```

## DEBOUNCE-COMPLETE-IDLE

```text
Given Idle and valid nondecreasing clock
When the source completes
Then complete downstream
Then release the source subscription
And closed by complete, with no pending value or timer
```

## DEBOUNCE-ERROR-IDLE

```text
Given Idle and valid nondecreasing clock
When the source errors
Then forward the source error unchanged
Then release the source subscription
And closed by error, with no pending value or timer
```

## DEBOUNCE-CANCEL-IDLE

```text
Given Idle and valid nondecreasing clock
When downstream unsubscribes
Then release the source subscription
And closed by cancel, with no pending value or timer
```

## DEBOUNCE-COMPLETE-PENDING

```text
Given Pending and valid nondecreasing clock
When the source completes
Then release the active timer task
Then emit the pending value unchanged
Then complete downstream
Then release the source subscription
And closed by complete, with no pending value or timer
```

## DEBOUNCE-ERROR-PENDING

```text
Given Pending and valid nondecreasing clock
When the source errors
Then forward the source error unchanged
Then release the source subscription
Then release the active timer task and discard the pending value
And closed by error, with no pending value or timer
```

## DEBOUNCE-CANCEL-PENDING

```text
Given Pending and valid nondecreasing clock
When downstream unsubscribes
Then release the source subscription
Then release the active timer task and discard the pending value
And closed by cancel, with no pending value or timer
```
