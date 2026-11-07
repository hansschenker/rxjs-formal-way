# delay-fixed-timer-3: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## DELAY-INIT

```text
Given Unsubscribed and fresh subscription
When subscribe to output
Then subscribe source
And state with documented resource ownership
```

## DELAY-SOURCE-NEXT

```text
Given Active and source live; timer mode
When admit one value and its duration
Then remember input as independent pending timer
Then schedule due
And state with documented resource ownership
```

## DELAY-SOURCE-SELECT

```text
Given Active and source live; selector mode
When admit one value and its duration
Then retain source value
Then request indexed duration selector
And state with documented resource ownership
```

## DELAY-SELECTOR-RETURN

```text
Given Active and matching pending callback
When selected duration returned
Then subscribe returned duration
And state with documented resource ownership
```

## DELAY-SELECTOR-THROW

```text
Given Active and matching pending callback
When duration selector threw
Then error
Then release outer and all admitted durations
And terminated; no late events legal
```

## DELAY-TIMER-FIRE

```text
Given Active and current timer at/after deadline; source remains live or peers pending
When scheduled timer executes at supplied now
Then cancel timer
Then emit its source payload
And state with documented resource ownership
```

## DELAY-TIMER-FINAL

```text
Given Active and last timer at/after deadline and source already complete
When scheduled timer executes at supplied now
Then emit value
Then complete
And terminated; no late events legal
```

## DELAY-DURATION-NEXT-Active

```text
Given Active and matching selected duration; closed only after outer finished and last item
When first duration next
Then emit pending value after first duration next
And state with documented resource ownership
```

## DELAY-DURATION-NEXT-Closed

```text
Given Active and matching selected duration; closed only after outer finished and last item
When first duration next
Then emit pending value after first duration next
And terminated; no late events legal
```

## DELAY-DURATION-EMPTY-Active

```text
Given Active and matching selected duration; closed only after outer finished and last item
When duration completed without next
Then discard pending value after empty completion
And state with documented resource ownership
```

## DELAY-DURATION-EMPTY-Closed

```text
Given Active and matching selected duration; closed only after outer finished and last item
When duration completed without next
Then discard pending value after empty completion
And terminated; no late events legal
```

## DELAY-DURATION-ERROR

```text
Given Active and matching selected duration
When duration error
Then error and release all subscriptions
And terminated; no late events legal
```

## DELAY-SOURCE-COMPLETE-WAIT

```text
Given Active and some pending duration remains
When source completion waits for inners
Then release source, await durations
And state with documented resource ownership
```

## DELAY-SOURCE-COMPLETE-EMPTY

```text
Given Active and no pending durations
When source completion waits for inners
Then complete and release source
And terminated; no late events legal
```

## DELAY-SOURCE-ERROR

```text
Given Active and source live
When source error
Then propagate error and cancel all pending durations
And terminated; no late events legal
```

## DELAY-CANCEL

```text
Given Active and downstream unsubscribed
When silent cancellation
Then cancel pending durations and live source; no terminal output
And terminated; no late events legal
```
