# takeUntil-Observable-notifier: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## TAKEUNTIL-INIT

```text
Given Unsubscribed and fresh execution
When a fresh result subscription connects
Then subscribe to the notifier, before the source
And starting with an open source gate
```

## TAKEUNTIL-SOURCE-CONNECT

```text
Given Starting and notifier setup returned without terminating downstream
When notifier subscription returns and synchronous initialization continues
Then subscribe to the source
And active with the existing gate and notifier-liveness state
```

## TAKEUNTIL-SETUP-NOTIFIER-NEXT

```text
Given Starting and matching live notifier subscription
When the live notifier delivers a value
Then complete downstream
Then release notifier
And closed because notifier emitted
```

## TAKEUNTIL-SETUP-NOTIFIER-COMPLETE

```text
Given Starting and matching live notifier subscription
When the notifier completes without another value
Then release notifier without completing downstream or changing the gate
And same gate with notifier disconnected
```

## TAKEUNTIL-SETUP-NOTIFIER-ERROR

```text
Given Starting and matching live notifier subscription
When the notifier errors
Then forward the notifier error unchanged
Then release notifier
And closed because notifier errored
```

## TAKEUNTIL-LIVE-NOTIFIER-NEXT

```text
Given Active and matching live notifier subscription
When the live notifier delivers a value
Then complete downstream
Then release notifier
Then release source
And closed because notifier emitted
```

## TAKEUNTIL-LIVE-NOTIFIER-COMPLETE

```text
Given Active and matching live notifier subscription
When the notifier completes without another value
Then release notifier without completing downstream or changing the gate
And same gate with notifier disconnected
```

## TAKEUNTIL-LIVE-NOTIFIER-ERROR

```text
Given Active and matching live notifier subscription
When the notifier errors
Then forward the notifier error unchanged
Then release notifier
Then release source
And closed because notifier errored
```

## TAKEUNTIL-PASS

```text
Given Active and gate is open
When the connected source delivers a value
Then forward the source value unchanged
And same gate and notifier-liveness state
```

## TAKEUNTIL-SOURCE-COMPLETE

```text
Given Active and source connected, regardless of gate state
When the connected source completes
Then complete downstream
Then release notifier if still live, then release source
And closed because of source.complete
```

## TAKEUNTIL-SOURCE-ERROR

```text
Given Active and source connected, regardless of gate state
When the connected source errors
Then forward the source error unchanged
Then release notifier if still live, then release source
And closed because of source.error
```

## TAKEUNTIL-CANCEL

```text
Given Active and source connected, regardless of gate state
When downstream cancels after setup
Then release notifier if still live, then release source
And closed because of cancel
```
