# windowCount-3-stride-1: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-22-COUNT-WINDOWS.md) for complete histories and their test witnesses.

## S22-WINDOWCOUNT-START

```text
Given Unsubscribed and no upstream connection exists
When First connection to this result execution.
Then emit initial Observable handle 0
Then subscribe to source
And Window zero is open and empty before the source is connected.
```

## S22-WINDOWCOUNT-NEXT

```text
Given Active and safe source count and window identity
When A value from the currently owned source subscription.
Then send source value to each open window observer
Then complete oldest due window
Then open next window after delivery at stride boundary
And Count advances; windows are completed or opened without replaying values.
```

## S22-WINDOWCOUNT-SOURCE-COMPLETE

```text
Given Active and source is live
When Successful source termination.
Then complete each open child before outer completion
Then complete outer result
Then release source
And All remaining open handles remember completion; completed historical handles are unchanged.
```

## S22-WINDOWCOUNT-SOURCE-ERROR

```text
Given Active and source is live
When Source failure with an opaque error value.
Then error each open child with same error identity
Then error outer result
Then release source
And Open handles retain the terminal error for late observers; earlier completed windows remain completed.
```

## S22-WINDOWCOUNT-CANCEL

```text
Given Active and outer subscriber cancels between events
When Consumer closes the result connection silently.
Then release source subscription silently
And Current open Subjects and their consumer subscriptions remain orphaned, unlike window(boundaries).
```

## S22-WINDOWCOUNT-OBSERVE-OPEN-ACTIVE

```text
Given Active and fresh observer ID names an open window; after stop, only cancelled windows stay open
When Independent observer attaches to an open or previously terminated window token.
Then acquire one named window observer subscription, no replay
And Observer joins the specified live Subject; no additional source subscription is made.
```

## S22-WINDOWCOUNT-OBSERVE-COMPLETE-ACTIVE

```text
Given Active and fresh observer ID names a completed window
When Independent observer attaches to an open or previously terminated window token.
Then subscribe and synchronously complete the new window observer
Then release observer subscription
And No consumer remains attached; this completed Subject does not replay any values.
```

## S22-WINDOWCOUNT-OBSERVER-UNSUBSCRIBE-ACTIVE

```text
Given Active and addressed observer owns an open window subscription
When Named window consumer closes its own connection.
Then release only the addressed child subscription
And Window and all other consumers are unchanged; source lifetime remains independently owned.
```

## S22-WINDOWCOUNT-OBSERVE-OPEN-STOPPED

```text
Given Stopped and fresh observer ID names an open window; after stop, only cancelled windows stay open
When Independent observer attaches to an open or previously terminated window token.
Then acquire one named window observer subscription, no replay
And Observer joins the specified live Subject; no additional source subscription is made.
```

## S22-WINDOWCOUNT-OBSERVE-COMPLETE-STOPPED

```text
Given Stopped and fresh observer ID names a completed window
When Independent observer attaches to an open or previously terminated window token.
Then subscribe and synchronously complete the new window observer
Then release observer subscription
And No consumer remains attached; this completed Subject does not replay any values.
```

## S22-WINDOWCOUNT-OBSERVE-ERROR-STOPPED

```text
Given Stopped and fresh observer names a failed window, which can occur only after source error
When Independent observer attaches to an open or previously terminated window token.
Then subscribe and immediately replay terminal error only
Then release observer subscription
And Observer is terminated with the same error identity; no value replay.
```

## S22-WINDOWCOUNT-OBSERVER-UNSUBSCRIBE-STOPPED

```text
Given Stopped and addressed observer owns an open window subscription
When Named window consumer closes its own connection.
Then release only the addressed child subscription
And Window and all other consumers are unchanged; source lifetime remains independently owned.
```
