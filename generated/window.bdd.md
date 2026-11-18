# window-observable-boundaries: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-21-SCENARIOS.md) for complete histories and their test witnesses.

## S21-WINDOW-START

```text
Given Unsubscribed and first result connection
When First connection to this result execution.
Then emit initial window handle
Then acquire source
Then acquire boundary Observable
And Window zero is open; both inputs are owned; no window consumer is attached yet.
```

## S21-WINDOW-SOURCE-NEXT

```text
Given Active and source is live
When A value from the currently owned source subscription.
Then deliver original value to current window consumers in attachment order
And The same window remains open; values are not buffered or retained for late consumers.
```

## S21-WINDOW-BOUNDARY-NEXT

```text
Given Active and boundary is live and next window identity is a safe integer
When Current boundary subscription emits; payload is ignored.
Then complete each current consumer and release its subscription
Then emit next window handle
And Previous window remains a completed historical handle; a new empty current window has no consumers.
```

## S21-WINDOW-BOUNDARY-COMPLETE

```text
Given Active and boundary is live
When Boundary stops without closing the current window.
Then release boundary input only
And Current window and source remain live; no further boundary events are legal.
```

## S21-WINDOW-SOURCE-COMPLETE

```text
Given Active and source completes successfully
When Successful source termination.
Then complete current consumers and release their subscriptions
Then complete outer result
Then release source and any live boundary
Then invalidate current handle during operator teardown
And Outer execution stopped; older rotated handles remain completed; current handle is invalidated.
```

## S21-WINDOW-SOURCE-ERROR

```text
Given Active and source is live
When Source failure with an opaque error value.
Then error current consumers and release their subscriptions
Then error outer result with identical payload
Then release source and any live boundary
Then invalidate current handle
And Outer execution stopped with error; older completed handles are unchanged.
```

## S21-WINDOW-BOUNDARY-ERROR

```text
Given Active and boundary is live
When Boundary fails with an opaque error payload.
Then error current consumers and release their subscriptions
Then error outer result with identical payload
Then release source and any live boundary
Then invalidate current handle
And Outer execution stopped with error; older completed handles are unchanged.
```

## S21-WINDOW-CANCEL

```text
Given Active and outer consumer cancels the result
When Consumer closes the result connection silently.
Then release source and any live boundary
Then invalidate current handle without notifying or closing existing consumer subscriptions
And Outer execution stopped; its current consumers are orphaned until they unsubscribe themselves.
```

## S21-WINDOW-OBSERVER-LIVE

```text
Given Active and fresh observer identity names the current open window
When A fresh addressed consumer attaches to a known open or previously rotated completed window.
Then acquire addressed window-consumer subscription; replay nothing
And Observer joins the current multicast window after existing consumers.
```

## S21-WINDOW-OBSERVER-COMPLETE-ACTIVE

```text
Given Active and fresh observer identity names a previously rotated completed handle
When A fresh addressed consumer attaches to a known open or previously rotated completed window.
Then attempt addressed window subscription
Then complete observer immediately
Then release its subscription
And No active consumer or source lease is added; observer identity is recorded as used.
```

## S21-WINDOW-OBSERVER-UNSUBSCRIBE-ACTIVE

```text
Given Active and addressed consumer subscription remains open
When An attached or orphaned consumer closes its own subscription.
Then release only that consumer subscription
And Consumer is removed; source/boundary ownership and the current window do not change.
```

## S21-WINDOW-OBSERVER-COMPLETE-STOPPED

```text
Given Stopped and fresh observer identity names a previously rotated completed handle
When A fresh addressed consumer attaches to a known open or previously rotated completed window.
Then attempt addressed window subscription
Then complete observer immediately
Then release its subscription
And No active consumer or source lease is added; observer identity is recorded as used.
```

## S21-WINDOW-OBSERVER-UNSUBSCRIBE-STOPPED

```text
Given Stopped and addressed consumer subscription remains open
When An attached or orphaned consumer closes its own subscription.
Then release only that consumer subscription
And Consumer is removed; source/boundary ownership and the current window do not change.
```
