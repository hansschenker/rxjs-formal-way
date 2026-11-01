# distinct-direct-flush: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## DISTINCT-INIT

```text
Given Unsubscribed and fresh result subscription
When fresh result subscription
Then subscribe source
Then subscribe flush notifier if configured; source first
And active with empty Set and optional flush subscription
```

## DISTINCT-SELECT

```text
Given Active and selector configured and index is valid
When source emits an original value
Then request a correlated key selection with the original value
And selecting a key with existing Set retained
```

## DISTINCT-DIRECT-PASS

```text
Given Active and no key selector and Set does not contain incoming value under SameValueZero
When source emits an original value
Then add original value to Set before forwarding it
And active with enlarged Set
```

## DISTINCT-DIRECT-DROP

```text
Given Active and no key selector and Set already contains incoming value under SameValueZero
When source emits an original value
Then emit no action
And active with unchanged Set and increased index
```

## DISTINCT-KEY-PASS

```text
Given Selecting and matching selection and previously unseen key under SameValueZero
When keySelector returns a key
Then add selected key then forward original source value
And active with enlarged keyed Set
```

## DISTINCT-KEY-DROP

```text
Given Selecting and matching selection and previously seen key under SameValueZero
When keySelector returns a key
Then emit no action
And active with unchanged Set
```

## DISTINCT-KEY-ERROR

```text
Given Selecting and matching selector invocation
When keySelector throws
Then forward exact selector error
Then release source and active notifier
And closed by selector error
```

## DISTINCT-FLUSH

```text
Given Active and notifier still active
When flush notifier emits a value and resets the key Set
Then clear the Set without forwarding the flush value
And active with empty Set
```

## DISTINCT-FLUSH-COMPLETE

```text
Given Active and notifier still active
When flush notifier completes without resetting or ending result
Then release notifier subscription without completing downstream or clearing the Set
And active, with the existing Set but no future flush events
```

## DISTINCT-FLUSH-ERROR

```text
Given Active and notifier still active
When flush notifier errors downstream
Then forward exact notifier error
Then release both subscriptions
And closed after notifier error
```

## DISTINCT-COMPLETE

```text
Given Active and no pending selector
When source completes
Then complete result; release source and active notifier
And closed after source completion
```

## DISTINCT-ERROR

```text
Given Active and no pending selector
When source errors
Then forward exact source error; release source and active notifier
And closed after source error
```

## DISTINCT-CANCEL

```text
Given Active and between completed source reactions
When downstream cancels
Then release source and active notifier without downstream completion
And closed by cancellation
```
