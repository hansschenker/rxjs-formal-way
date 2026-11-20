# windowTime-5-2-max-2: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-22-TIMED-WINDOWS.md) for complete histories and their test witnesses.

## S22-WINDOWTIME-START

```text
Given Unsubscribed and first connection; safe supplied scheduler time
When First connection to this result execution.
Then schedule recurring creation if configured
Then emit initial window handle
Then schedule its close
Then acquire source
And One empty window is live; its deadline is now + span.
```

## S22-WINDOWTIME-NEXT

```text
Given Active and source is live; counts and possible new window identity remain safe
When A value from the currently owned source subscription.
Then for each current window in order: deliver source value
Then complete and cancel any window reaching maxSize
Then restart immediately only in sequential mode
And Per-window counts advance; a restarted window does not receive the value that closed its predecessor.
```

## S22-WINDOWTIME-WINDOW-TIMER

```text
Given Active and current live window timer generation; now is at or after its deadline
When Current window close timer delivers its generation at or after its deadline.
Then complete addressed window observers
Then cancel its timer
Then restart and schedule successor only in sequential mode
And The specified window completes without replay; historical completed handles remain usable.
```

## S22-WINDOWTIME-CREATION-TIMER

```text
Given Active and configured recurring creation timer, matching tick and generation, now at or after due
When The configured recurring creation task delivers its current firing tick.
Then emit new window handle
Then schedule that window close
Then reschedule recurring creation timer
And Creation tick advances and its next deadline is now + creationInterval; previous windows are unchanged.
```

## S22-WINDOWTIME-SOURCE-COMPLETE

```text
Given Active and source is live
When Successful source termination.
Then terminate every active window in creation order
Then terminate outer result
Then cancel creation and initial-window timers
Then release source
Then cancel later-window timers
And All current handles remember the source terminal; historical completed handles retain completion.
```

## S22-WINDOWTIME-SOURCE-ERROR

```text
Given Active and source is live
When Source failure with an opaque error value.
Then terminate every active window in creation order
Then terminate outer result
Then cancel creation and initial-window timers
Then release source
Then cancel later-window timers
And All current handles remember the source terminal; historical completed handles retain completion.
```

## S22-WINDOWTIME-CANCEL

```text
Given Active and outer connection is live
When Consumer closes the result connection silently.
Then release timers and source in registration order without notifications
And Open window Subjects and their child subscriptions become silent orphans; historical handles remain usable.
```

## S22-WINDOWTIME-OBSERVE-OPEN-ACTIVE

```text
Given Active and fresh observer identity names an open window
When Fresh observer attaches to an emitted current or historical window.
Then acquire independent window observer without replay
And Observer joins the addressed multicast Subject, including a silent orphan after outer cancellation.
```

## S22-WINDOWTIME-OBSERVE-COMPLETE-ACTIVE

```text
Given Active and fresh observer identity names a completed window
When Fresh observer attaches to an emitted current or historical window.
Then acquire child observer
Then deliver completion immediately
Then release child observer
And Observer identity is recorded but no live child subscription remains.
```

## S22-WINDOWTIME-DETACH-ACTIVE

```text
Given Active and named child observer is attached
When One child observer closes its independent connection.
Then release only the addressed child observer
And Other consumers, source ownership and timer ownership do not change.
```

## S22-WINDOWTIME-OBSERVE-OPEN-STOPPED

```text
Given Stopped and fresh observer identity names an open window
When Fresh observer attaches to an emitted current or historical window.
Then acquire independent window observer without replay
And Observer joins the addressed multicast Subject, including a silent orphan after outer cancellation.
```

## S22-WINDOWTIME-OBSERVE-COMPLETE-STOPPED

```text
Given Stopped and fresh observer identity names a completed window
When Fresh observer attaches to an emitted current or historical window.
Then acquire child observer
Then deliver completion immediately
Then release child observer
And Observer identity is recorded but no live child subscription remains.
```

## S22-WINDOWTIME-DETACH-STOPPED

```text
Given Stopped and named child observer is attached
When One child observer closes its independent connection.
Then release only the addressed child observer
And Other consumers, source ownership and timer ownership do not change.
```

## S22-WINDOWTIME-OBSERVE-ERROR-STOPPED

```text
Given Stopped and fresh observer names a window failed by the source
When Fresh observer attaches to an emitted current or historical window.
Then acquire child observer
Then deliver retained error by identity
Then release child observer
And Failed handle remains failed; no source values are replayed.
```
