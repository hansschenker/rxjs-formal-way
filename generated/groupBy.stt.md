# groupBy-default-subject-key-leases: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S13-GROUPBY-INIT | Unsubscribed | subscribe | fresh outer subscriber | connect source | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-INIT |
| S13-GROUPBY-SELECT-Active | Active | source.next | shared source live; key index is safe | request one indexed key callback | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-SELECT-Active |
| S13-GROUPBY-DONE-Active | Active | source.complete | source ends normally | complete all groups before outer; release source | terminal, group registry cleared on upstream teardown | S13-GROUPBY-DONE-Active |
| S13-GROUPBY-ERROR-Active | Active | source.error | source errors | error all groups before outer; release source | terminal, group registry cleared on upstream teardown | S13-GROUPBY-ERROR-Active |
| S13-GROUPBY-ATTACH-Active | Active | group.subscribe | known group has no active subscriber | attach one group consumer | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-ATTACH-Active |
| S13-GROUPBY-DETACH-ACTIVE | Active | group.unsubscribe | known group has its one active subscriber | release child lease | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-DETACH-ACTIVE |
| S13-GROUPBY-SELECT-Orphaned | Orphaned | source.next | shared source live; key index is safe | request one indexed key callback | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-SELECT-Orphaned |
| S13-GROUPBY-DONE-Orphaned | Orphaned | source.complete | source ends normally | complete all groups before outer; release source | terminal, group registry cleared on upstream teardown | S13-GROUPBY-DONE-Orphaned |
| S13-GROUPBY-ERROR-Orphaned | Orphaned | source.error | source errors | error all groups before outer; release source | terminal, group registry cleared on upstream teardown | S13-GROUPBY-ERROR-Orphaned |
| S13-GROUPBY-ATTACH-Orphaned | Orphaned | group.subscribe | known group has no active subscriber | attach one group consumer | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-ATTACH-Orphaned |
| S13-GROUPBY-DETACH-RETAIN | Orphaned | group.unsubscribe | another group remains subscribed | release this group lease; retain source | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-DETACH-RETAIN |
| S13-GROUPBY-DETACH-LAST | Orphaned | group.unsubscribe | last live child lease released after outer cancellation | release child lease; disconnect source | terminal, group registry cleared on upstream teardown | S13-GROUPBY-DETACH-LAST |
| S13-GROUPBY-KEY-EXISTING-Active | Calling | callback.return | correlated key and Map has an existing subject | emit one value into existing keyed Subject | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-KEY-EXISTING-Active |
| S13-GROUPBY-KEY-NEW-Active | Calling | callback.return | correlated key not yet in Map | announce GroupedObservable then Subject.next; feed original source value into new Subject | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-KEY-NEW-Active |
| S13-GROUPBY-KEY-THROW-Active | Calling | callback.throw | correlated key selector throws | error grouped subjects; error outer when subscribed; release source | terminal, group registry cleared on upstream teardown | S13-GROUPBY-KEY-THROW-Active |
| S13-GROUPBY-KEY-EXISTING-Orphaned | Calling | callback.return | correlated key and Map has an existing subject | emit one value into existing keyed Subject | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-KEY-EXISTING-Orphaned |
| S13-GROUPBY-KEY-NEW-Orphaned | Calling | callback.return | correlated key not yet in Map | do not announce new group to cancelled outer; feed original source value into new Subject | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-KEY-NEW-Orphaned |
| S13-GROUPBY-KEY-THROW-Orphaned | Calling | callback.throw | correlated key selector throws | error grouped subjects; error outer when subscribed; release source | terminal, group registry cleared on upstream teardown | S13-GROUPBY-KEY-THROW-Orphaned |
| S13-GROUPBY-CANCEL-NO-CHILD | Active | cancel | outer unsubscribes with no active group subscribers | unsubscribe source silently | terminal, group registry cleared on upstream teardown | S13-GROUPBY-CANCEL-NO-CHILD |
| S13-GROUPBY-CANCEL-WITH-CHILD | Active | cancel | at least one group subscriber remains | outer subscription ends, shared source stays connected | group keys and child subscriber leases remain subscription-local | S13-GROUPBY-CANCEL-WITH-CHILD |
