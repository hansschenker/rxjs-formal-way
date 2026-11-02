# skipUntil-Observable-notifier: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## SKIPUNTIL-INIT

```text
Given Unsubscribed and fresh execution
When a fresh result subscription connects
Then subscribe to the notifier, before the source
And starting with a closed source gate
```

## SKIPUNTIL-SOURCE-CONNECT

```text
Given Starting and notifier setup returned without terminating downstream
When notifier subscription returns and synchronous initialization continues
Then subscribe to the source
And active with the existing gate and notifier-liveness state
```

## SKIPUNTIL-SETUP-NOTIFIER-NEXT

```text
Given Starting and matching live notifier subscription
When the live notifier delivers a value
Then release notifier without emitting any value
And gate permanently open with notifier disconnected
```

## SKIPUNTIL-SETUP-NOTIFIER-COMPLETE

```text
Given Starting and matching live notifier subscription
When the notifier completes without another value
Then release notifier without completing downstream or changing the gate
And same gate with notifier disconnected
```

## SKIPUNTIL-SETUP-NOTIFIER-ERROR

```text
Given Starting and matching live notifier subscription
When the notifier errors
Then forward the notifier error unchanged
Then release notifier
And downstream stopped but closed-subscriber source attempt still pending
```

## SKIPUNTIL-LIVE-NOTIFIER-NEXT

```text
Given Active and matching live notifier subscription
When the live notifier delivers a value
Then release notifier without emitting any value
And gate permanently open with notifier disconnected
```

## SKIPUNTIL-LIVE-NOTIFIER-COMPLETE

```text
Given Active and matching live notifier subscription
When the notifier completes without another value
Then release notifier without completing downstream or changing the gate
And same gate with notifier disconnected
```

## SKIPUNTIL-LIVE-NOTIFIER-ERROR

```text
Given Active and matching live notifier subscription
When the notifier errors
Then forward the notifier error unchanged
Then release notifier
Then release source
And closed because notifier errored
```

## SKIPUNTIL-CLOSED-SOURCE-ATTEMPT

```text
Given StoppedBeforeSource and notifier setup returned after synchronous error
When notifier subscription returns and synchronous initialization continues
Then attempt source subscription with an already-closed subscriber
Then dispose the returned source teardown immediately
And fully closed with no live subscriptions
```

## SKIPUNTIL-DROP

```text
Given Active and gate is closed
When the connected source delivers a value
Then emit no action
And same gate and notifier-liveness state
```

## SKIPUNTIL-PASS

```text
Given Active and gate is open
When the connected source delivers a value
Then forward the source value unchanged
And same gate and notifier-liveness state
```

## SKIPUNTIL-SOURCE-COMPLETE

```text
Given Active and source connected, regardless of gate state
When the connected source completes
Then complete downstream
Then release notifier if still live, then release source
And closed because of source.complete
```

## SKIPUNTIL-SOURCE-ERROR

```text
Given Active and source connected, regardless of gate state
When the connected source errors
Then forward the source error unchanged
Then release notifier if still live, then release source
And closed because of source.error
```

## SKIPUNTIL-CANCEL

```text
Given Active and source connected, regardless of gate state
When downstream cancels after setup
Then release notifier if still live, then release source
And closed because of cancel
```
