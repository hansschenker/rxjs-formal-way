# expand-unbounded: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## EXPAND-INIT

```text
Given Unsubscribed and fresh execution
When connect a fresh recursive expansion execution
Then subscribe outer source
And updated control and memory
```

## EXPAND-OUTER-ADMIT

```text
Given Active and capacity available
When original source produces a value eligible for expansion
Then emit input first
Then invoke projection with zero-based expansion index
And updated control and memory
```

## EXPAND-INNER-ADMIT-ACTIVE

```text
Given Active and known inner and expansion capacity available
When active recursive inner emits a value that is fed back into expansion
Then emit recursive value
Then feed recursive value into projection
And updated control and memory
```

## EXPAND-INNER-ADMIT-DRAINING

```text
Given Draining and known inner and expansion capacity available
When active recursive inner emits a value that is fed back into expansion
Then emit recursive value
Then feed recursive value into projection
And updated control and memory
```

## EXPAND-PROJECT-RETURN

```text
Given Calling and correlated projection return while outer open
When correlated projection returns an Observable source token
Then subscribe returned inner occurrence
And updated control and memory
```

## EXPAND-PROJECT-RETURN-DRAINING

```text
Given Calling and correlated projection return after outer completion
When correlated projection returns an Observable source token
Then subscribe returned inner occurrence
And updated control and memory
```

## EXPAND-PROJECT-THROW

```text
Given Calling and correlated projection throws
When correlated projection throws
Then error downstream
Then release all owned subscriptions
And terminal state with no owned live work
```

## EXPAND-INNER-COMPLETE-ACTIVE

```text
Given Active and known inner completes with no queued value
When an active recursive inner completes
Then release completed inner
And updated control and memory
```

## EXPAND-INNER-COMPLETE-DRAINING-MORE

```text
Given Draining and known inner completes but other recursive work remains
When an active recursive inner completes
Then release completed inner
And updated control and memory
```

## EXPAND-INNER-COMPLETE-DRAINING-LAST

```text
Given Draining and last known inner completes and no queue remains
When an active recursive inner completes
Then release completed inner
Then complete downstream
And terminal state with no owned live work
```

## EXPAND-INNER-ERROR-ACTIVE

```text
Given Active and known inner errors
When an active recursive inner errors
Then forward exact error
Then release outer if open and all active inners
And terminal state with no owned live work
```

## EXPAND-INNER-ERROR-DRAINING

```text
Given Draining and known inner errors
When an active recursive inner errors
Then forward exact error
Then release outer if open and all active inners
And terminal state with no owned live work
```

## EXPAND-OUTER-COMPLETE

```text
Given Active and recursive work remains active or queued
When original source completes; admitted recursive work may remain
Then release outer and wait
And updated control and memory
```

## EXPAND-OUTER-COMPLETE-IDLE

```text
Given Active and no recursive work remains
When original source completes; admitted recursive work may remain
Then release outer
Then complete downstream
And terminal state with no owned live work
```

## EXPAND-OUTER-ERROR

```text
Given Active and outer errors
When original source errors
Then forward exact error
Then release outer and all active inners
And terminal state with no owned live work
```

## EXPAND-CANCEL-ACTIVE

```text
Given Active and downstream closes
When release outer and active recursive inners silently
Then release owned subscriptions silently
And terminal state with no owned live work
```

## EXPAND-CANCEL-DRAINING

```text
Given Draining and downstream closes
When release outer and active recursive inners silently
Then release owned subscriptions silently
And terminal state with no owned live work
```

## EXPAND-CANCEL-CALLING

```text
Given Calling and downstream closes between callback request and outcome
When release outer and active recursive inners silently
Then release owned subscriptions silently
And terminal state with no owned live work
```
