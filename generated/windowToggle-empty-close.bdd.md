# windowToggle-signals: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-22-TOGGLE-WINDOWS.md) for complete histories and their test witnesses.

## S22-WINDOWTOGGLE-START

```text
Given Unsubscribed and first result connection
When First connection to this result execution.
Then subscribe opening signal
Then subscribe source; emit no initial window
And Active, no windows or consumers; opening signal is live.
```

## S22-WINDOWTOGGLE-OPEN

```text
Given Active and opening signal is live and next identity can advance safely
When Opening signal carries the selector input.
Then create unannounced window record
Then invoke closingSelector with exact opening payload
And Selecting with one pending window identity; no handle has been emitted for it.
```

## S22-WINDOWTOGGLE-SELECTOR-RETURN

```text
Given Selecting and matching synchronous selector returns a valid Observable
When Matching synchronous valid Observable result.
Then announce Observable handle
Then subscribe its closing signal
And Pending window becomes open, announced and attached to its uniquely identified closing subscription.
```

## S22-WINDOWTOGGLE-SELECTOR-THROW

```text
Given Selecting and matching synchronous selector throws
When Matching synchronous selector failure.
Then error open window consumers
Then error outer result
Then release opening, source and live closings
And Stopped with retained errored handles; failed pending window was never announced.
```

## S22-WINDOWTOGGLE-SOURCE-NEXT

```text
Given Active and source is connected between atomic reactions
When A value from the currently owned source subscription.
Then send the same value to each open window consumer in window creation and observer attachment order
And All window and closing state remains unchanged.
```

## S22-WINDOWTOGGLE-CLOSING-NEXT

```text
Given Active and addressed closing subscription is live
When Identified closing signal closes its window.
Then complete this window consumers
Then release this closing subscription
And Window retains completion; other windows, source and opening signal are unchanged.
```

## S22-WINDOWTOGGLE-CLOSING-COMPLETE

```text
Given Active and addressed closing subscription is live
When Identified closing signal completes without closing its window.
Then release this closing subscription only
And Window stays open without a live closing signal.
```

## S22-WINDOWTOGGLE-OPENING-COMPLETE

```text
Given Active and opening subscription is live
When No future openings; existing windows persist.
Then release opening subscription only
And No more windows can open; source and current windows continue.
```

## S22-WINDOWTOGGLE-SOURCE-ERROR

```text
Given Active and source is connected
When Source failure with an opaque error value.
Then error every open window consumer before outer error
Then release opening, source and remaining closings
And Stopped; failed windows retain their exact error for late observers; completed windows remain completed.
```

## S22-WINDOWTOGGLE-CLOSING-ERROR

```text
Given Active and addressed closing subscription is live
When One closing signal fails all live windows and the result.
Then error every open window consumer before outer error
Then release opening, source and remaining closings
And Stopped; failed windows retain their exact error for late observers; completed windows remain completed.
```

## S22-WINDOWTOGGLE-SOURCE-COMPLETE

```text
Given Active and source is connected
When Successful source termination.
Then complete all open window consumers before outer completion
Then release opening, source and live closings
And Stopped; every announced window retains completion and can complete late consumers.
```

## S22-WINDOWTOGGLE-OPENING-ERROR

```text
Given Active and opening subscription is live
When Outer error with silent current-window disposal.
Then error outer result only
Then release opening, source and live closings; dispose current Subjects silently
And Stopped; current handles are disposed and existing child subscriptions remain orphaned.
```

## S22-WINDOWTOGGLE-CANCEL

```text
Given Active and outer consumer cancels between reactions
When Consumer closes the result connection silently.
Then release opening, source and live closings; dispose current Subjects silently
And Stopped; attached child Subscriptions remain independently closeable and current handles reject late subscription.
```

## S22-WINDOWTOGGLE-OBSERVE-OPEN

```text
Given Active and fresh observer names an announced open window
When Independent consumer attaches to an announced usable window.
Then acquire one child observer connection without replay
And Consumer is attached; no upstream lease is added.
```

## S22-WINDOWTOGGLE-OBSERVE-COMPLETE-ACTIVE

```text
Given Active and fresh observer names an announced complete window
When Independent consumer attaches to an announced usable window.
Then acquire observer
Then deliver retained terminal notification without value replay
Then release observer
And No consumer remains attached; the historical handle retains its terminal state.
```

## S22-WINDOWTOGGLE-OBSERVER-CLOSE-ACTIVE

```text
Given Active and addressed child observer still owns a subscription
When Independent consumer closes its own connection.
Then release only the addressed observer
And Other children and upstream resources are unchanged.
```

## S22-WINDOWTOGGLE-OBSERVE-COMPLETE-STOPPED

```text
Given Stopped and fresh observer names an announced complete window
When Independent consumer attaches to an announced usable window.
Then acquire observer
Then deliver retained terminal notification without value replay
Then release observer
And No consumer remains attached; the historical handle retains its terminal state.
```

## S22-WINDOWTOGGLE-OBSERVE-ERROR-STOPPED

```text
Given Stopped and fresh observer names an announced error window
When Independent consumer attaches to an announced usable window.
Then acquire observer
Then deliver retained terminal notification without value replay
Then release observer
And No consumer remains attached; the historical handle retains its terminal state.
```

## S22-WINDOWTOGGLE-OBSERVER-CLOSE-STOPPED

```text
Given Stopped and addressed child observer still owns a subscription
When Independent consumer closes its own connection.
Then release only the addressed observer
And Other children and upstream resources are unchanged.
```
