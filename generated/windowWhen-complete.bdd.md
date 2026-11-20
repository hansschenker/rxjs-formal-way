# windowWhen-deferred-closing: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-22-WHEN-WINDOWS.md) for complete histories and their test witnesses.

## S22-WINDOWWHEN-START

```text
Given Unsubscribed and no result connection exists
When First connection to this result execution.
Then emit initial window handle zero
Then invoke closing selector zero with no argument
And Initial window is open; source and closing connections await the synchronous factory outcome.
```

## S22-WINDOWWHEN-FACTORY-RETURN

```text
Given Selecting and outcome belongs to the current synchronous invocation
When Current selector returns a valid closing Observable.
Then acquire closing subscription occurrence
Then acquire source only for initial setup
And One closing occurrence watches the open window; source is connected exactly once.
```

## S22-WINDOWWHEN-FACTORY-THROW

```text
Given Selecting and throw belongs to the current synchronous invocation
When Current selector throws an opaque error.
Then remember error on newly announced window
Then error outer
Then release source, or record closed-source acquisition attempt during initial setup
And New window retains the exact error; old windows remain completed.
```

## S22-WINDOWWHEN-SOURCE-NEXT

```text
Given Active and source connection is live
When A value from the currently owned source subscription.
Then forward identical payload to every observer of the current window in attachment order
And No values are buffered and no closing state changes.
```

## S22-WINDOWWHEN-CLOSING-NEXT

```text
Given Active and current closing generation; next window identity remains a safe integer
When Current closing occurrence emits; payload is ignored.
Then unsubscribe old closing occurrence
Then complete and release old window consumers
Then emit successor handle
Then invoke next closing selector
And Old window remembers completion; a new empty window awaits its factory result.
```

## S22-WINDOWWHEN-CLOSING-COMPLETE

```text
Given Active and current closing generation; next window identity remains a safe integer
When Current closing occurrence completes and rotates.
Then unsubscribe old closing occurrence
Then complete and release old window consumers
Then emit successor handle
Then invoke next closing selector
And Old window remembers completion; a new empty window awaits its factory result.
```

## S22-WINDOWWHEN-SOURCE-COMPLETE

```text
Given Active and source connection is live
When Successful source termination.
Then complete current children
Then complete outer
Then disconnect inputs in subscription ownership order
And Every retained window is completed; no replacement window is created.
```

## S22-WINDOWWHEN-SOURCE-ERROR

```text
Given Active and live source, or matching current closing generation
When Source failure with an opaque error value.
Then error current children with original payload
Then error outer
Then disconnect inputs in subscription ownership order
And Current handle remembers failure; older handles retain successful completion.
```

## S22-WINDOWWHEN-CLOSING-ERROR

```text
Given Active and live source, or matching current closing generation
When Current closing occurrence fails the execution.
Then error current children with original payload
Then error outer
Then disconnect inputs in subscription ownership order
And Current handle remembers failure; older handles retain successful completion.
```

## S22-WINDOWWHEN-CANCEL

```text
Given Active and outer connection closes between complete reactions
When Consumer closes the result connection silently.
Then disconnect inputs silently in subscription ownership order
And Current Subject stays open but orphaned; existing child subscriptions remain independently owned.
```

## S22-WINDOWWHEN-OBSERVE-OPEN-ACTIVE

```text
Given Active and fresh observer identity names a retained open window
When A fresh named observer attaches to a retained handle.
Then acquire child observer, no replay
And Child is attached independently to the open Subject.
```

## S22-WINDOWWHEN-OBSERVE-COMPLETE-ACTIVE

```text
Given Active and fresh observer identity names a retained complete window
When A fresh named observer attaches to a retained handle.
Then acquire child observer
Then deliver retained terminal only
Then release child observer
And No child remains attached to a terminated Subject.
```

## S22-WINDOWWHEN-OBSERVER-UNSUBSCRIBE-ACTIVE

```text
Given Active and named observer owns a live child subscription
When A live named child observer closes its own subscription.
Then release only that child subscription
And All peers, window handles and upstream connections are unchanged.
```

## S22-WINDOWWHEN-OBSERVE-OPEN-STOPPED

```text
Given Stopped and fresh observer identity names a retained open window
When A fresh named observer attaches to a retained handle.
Then acquire child observer, no replay
And Child is attached independently to the open Subject.
```

## S22-WINDOWWHEN-OBSERVE-COMPLETE-STOPPED

```text
Given Stopped and fresh observer identity names a retained complete window
When A fresh named observer attaches to a retained handle.
Then acquire child observer
Then deliver retained terminal only
Then release child observer
And No child remains attached to a terminated Subject.
```

## S22-WINDOWWHEN-OBSERVE-ERROR-STOPPED

```text
Given Stopped and fresh observer identity names a retained error window
When A fresh named observer attaches to a retained handle.
Then acquire child observer
Then deliver retained terminal only
Then release child observer
And No child remains attached to a terminated Subject.
```

## S22-WINDOWWHEN-OBSERVER-UNSUBSCRIBE-STOPPED

```text
Given Stopped and named observer owns a live child subscription
When A live named child observer closes its own subscription.
Then release only that child subscription
And All peers, window handles and upstream connections are unchanged.
```
