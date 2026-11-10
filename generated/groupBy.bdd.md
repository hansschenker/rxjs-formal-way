# groupBy-default-subject-key-leases: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S13-GROUPBY-INIT

```text
Given Unsubscribed and fresh outer subscriber
When outer observer subscribes, enabling one upstream execution
Then connect source
And group keys and child subscriber leases remain subscription-local
```

## S13-GROUPBY-SELECT-Active

```text
Given Active and shared source live; key index is safe
When upstream value requires key selection
Then request one indexed key callback
And group keys and child subscriber leases remain subscription-local
```

## S13-GROUPBY-DONE-Active

```text
Given Active and source ends normally
When complete each known group before outer completion
Then complete all groups before outer
Then release source
And terminal, group registry cleared on upstream teardown
```

## S13-GROUPBY-ERROR-Active

```text
Given Active and source errors
When propagate identical error to groups and outer
Then error all groups before outer
Then release source
And terminal, group registry cleared on upstream teardown
```

## S13-GROUPBY-ATTACH-Active

```text
Given Active and known group has no active subscriber
When one subscriber begins observing an emitted grouped Observable
Then attach one group consumer
And group keys and child subscriber leases remain subscription-local
```

## S13-GROUPBY-DETACH-ACTIVE

```text
Given Active and known group has its one active subscriber
When group subscriber releases its lease
Then release child lease
And group keys and child subscriber leases remain subscription-local
```

## S13-GROUPBY-SELECT-Orphaned

```text
Given Orphaned and shared source live; key index is safe
When upstream value requires key selection
Then request one indexed key callback
And group keys and child subscriber leases remain subscription-local
```

## S13-GROUPBY-DONE-Orphaned

```text
Given Orphaned and source ends normally
When complete each known group before outer completion
Then complete all groups before outer
Then release source
And terminal, group registry cleared on upstream teardown
```

## S13-GROUPBY-ERROR-Orphaned

```text
Given Orphaned and source errors
When propagate identical error to groups and outer
Then error all groups before outer
Then release source
And terminal, group registry cleared on upstream teardown
```

## S13-GROUPBY-ATTACH-Orphaned

```text
Given Orphaned and known group has no active subscriber
When one subscriber begins observing an emitted grouped Observable
Then attach one group consumer
And group keys and child subscriber leases remain subscription-local
```

## S13-GROUPBY-DETACH-RETAIN

```text
Given Orphaned and another group remains subscribed
When group subscriber releases its lease
Then release this group lease
Then retain source
And group keys and child subscriber leases remain subscription-local
```

## S13-GROUPBY-DETACH-LAST

```text
Given Orphaned and last live child lease released after outer cancellation
When group subscriber releases its lease
Then release child lease
Then disconnect source
And terminal, group registry cleared on upstream teardown
```

## S13-GROUPBY-KEY-EXISTING-Active

```text
Given Calling and correlated key and Map has an existing subject
When correlated key selector returns a key, using Map SameValueZero identity
Then emit one value into existing keyed Subject
And group keys and child subscriber leases remain subscription-local
```

## S13-GROUPBY-KEY-NEW-Active

```text
Given Calling and correlated key not yet in Map
When correlated key selector returns a key, using Map SameValueZero identity
Then announce GroupedObservable then Subject.next
Then feed original source value into new Subject
And group keys and child subscriber leases remain subscription-local
```

## S13-GROUPBY-KEY-THROW-Active

```text
Given Calling and correlated key selector throws
When key selector threw; error is sent to groups and outer
Then error grouped subjects
Then error outer when subscribed
Then release source
And terminal, group registry cleared on upstream teardown
```

## S13-GROUPBY-KEY-EXISTING-Orphaned

```text
Given Calling and correlated key and Map has an existing subject
When correlated key selector returns a key, using Map SameValueZero identity
Then emit one value into existing keyed Subject
And group keys and child subscriber leases remain subscription-local
```

## S13-GROUPBY-KEY-NEW-Orphaned

```text
Given Calling and correlated key not yet in Map
When correlated key selector returns a key, using Map SameValueZero identity
Then do not announce new group to cancelled outer
Then feed original source value into new Subject
And group keys and child subscriber leases remain subscription-local
```

## S13-GROUPBY-KEY-THROW-Orphaned

```text
Given Calling and correlated key selector throws
When key selector threw; error is sent to groups and outer
Then error grouped subjects
Then error outer when subscribed
Then release source
And terminal, group registry cleared on upstream teardown
```

## S13-GROUPBY-CANCEL-NO-CHILD

```text
Given Active and outer unsubscribes with no active group subscribers
When outer consumer unsubscribes; child groups may keep upstream connected
Then unsubscribe source silently
And terminal, group registry cleared on upstream teardown
```

## S13-GROUPBY-CANCEL-WITH-CHILD

```text
Given Active and at least one group subscriber remains
When outer consumer unsubscribes; child groups may keep upstream connected
Then outer subscription ends, shared source stays connected
And group keys and child subscriber leases remain subscription-local
```
