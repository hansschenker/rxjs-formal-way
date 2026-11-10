# groupBy-default-subject-key-leases: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session13-rxjs.test.mjs.

## S13-GROUPBY-INIT

Reach **Unsubscribed** with **fresh outer subscriber**, then provide **subscribe**.

Expect, in order: connect source.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-INIT.

## S13-GROUPBY-SELECT-Active

Reach **Active** with **shared source live; key index is safe**, then provide **source.next**.

Expect, in order: request one indexed key callback.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-SELECT-Active.

## S13-GROUPBY-DONE-Active

Reach **Active** with **source ends normally**, then provide **source.complete**.

Expect, in order: complete all groups before outer; release source.

Resulting state: terminal, group registry cleared on upstream teardown. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-DONE-Active.

## S13-GROUPBY-ERROR-Active

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: error all groups before outer; release source.

Resulting state: terminal, group registry cleared on upstream teardown. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-ERROR-Active.

## S13-GROUPBY-ATTACH-Active

Reach **Active** with **known group has no active subscriber**, then provide **group.subscribe**.

Expect, in order: attach one group consumer.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-ATTACH-Active.

## S13-GROUPBY-DETACH-ACTIVE

Reach **Active** with **known group has its one active subscriber**, then provide **group.unsubscribe**.

Expect, in order: release child lease.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-DETACH-ACTIVE.

## S13-GROUPBY-SELECT-Orphaned

Reach **Orphaned** with **shared source live; key index is safe**, then provide **source.next**.

Expect, in order: request one indexed key callback.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-SELECT-Orphaned.

## S13-GROUPBY-DONE-Orphaned

Reach **Orphaned** with **source ends normally**, then provide **source.complete**.

Expect, in order: complete all groups before outer; release source.

Resulting state: terminal, group registry cleared on upstream teardown. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-DONE-Orphaned.

## S13-GROUPBY-ERROR-Orphaned

Reach **Orphaned** with **source errors**, then provide **source.error**.

Expect, in order: error all groups before outer; release source.

Resulting state: terminal, group registry cleared on upstream teardown. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-ERROR-Orphaned.

## S13-GROUPBY-ATTACH-Orphaned

Reach **Orphaned** with **known group has no active subscriber**, then provide **group.subscribe**.

Expect, in order: attach one group consumer.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-ATTACH-Orphaned.

## S13-GROUPBY-DETACH-RETAIN

Reach **Orphaned** with **another group remains subscribed**, then provide **group.unsubscribe**.

Expect, in order: release this group lease; retain source.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-DETACH-RETAIN.

## S13-GROUPBY-DETACH-LAST

Reach **Orphaned** with **last live child lease released after outer cancellation**, then provide **group.unsubscribe**.

Expect, in order: release child lease; disconnect source.

Resulting state: terminal, group registry cleared on upstream teardown. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-DETACH-LAST.

## S13-GROUPBY-KEY-EXISTING-Active

Reach **Calling** with **correlated key and Map has an existing subject**, then provide **callback.return**.

Expect, in order: emit one value into existing keyed Subject.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-KEY-EXISTING-Active.

## S13-GROUPBY-KEY-NEW-Active

Reach **Calling** with **correlated key not yet in Map**, then provide **callback.return**.

Expect, in order: announce GroupedObservable then Subject.next; feed original source value into new Subject.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-KEY-NEW-Active.

## S13-GROUPBY-KEY-THROW-Active

Reach **Calling** with **correlated key selector throws**, then provide **callback.throw**.

Expect, in order: error grouped subjects; error outer when subscribed; release source.

Resulting state: terminal, group registry cleared on upstream teardown. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-KEY-THROW-Active.

## S13-GROUPBY-KEY-EXISTING-Orphaned

Reach **Calling** with **correlated key and Map has an existing subject**, then provide **callback.return**.

Expect, in order: emit one value into existing keyed Subject.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-KEY-EXISTING-Orphaned.

## S13-GROUPBY-KEY-NEW-Orphaned

Reach **Calling** with **correlated key not yet in Map**, then provide **callback.return**.

Expect, in order: do not announce new group to cancelled outer; feed original source value into new Subject.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-KEY-NEW-Orphaned.

## S13-GROUPBY-KEY-THROW-Orphaned

Reach **Calling** with **correlated key selector throws**, then provide **callback.throw**.

Expect, in order: error grouped subjects; error outer when subscribed; release source.

Resulting state: terminal, group registry cleared on upstream teardown. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-KEY-THROW-Orphaned.

## S13-GROUPBY-CANCEL-NO-CHILD

Reach **Active** with **outer unsubscribes with no active group subscribers**, then provide **cancel**.

Expect, in order: unsubscribe source silently.

Resulting state: terminal, group registry cleared on upstream teardown. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-CANCEL-NO-CHILD.

## S13-GROUPBY-CANCEL-WITH-CHILD

Reach **Active** with **at least one group subscriber remains**, then provide **cancel**.

Expect, in order: outer subscription ends, shared source stays connected.

Resulting state: group keys and child subscriber leases remain subscription-local. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-GROUPBY-CANCEL-WITH-CHILD.
