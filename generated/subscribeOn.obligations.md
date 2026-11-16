# subscribeOn-virtualFIFO-delay-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session19-rxjs.test.mjs.

## S19-SUBSCRIBEON-SCHEDULE

Reach **Unsubscribed** with **downstream starts**, then provide **subscribe**.

Expect, in order: schedule subscription action with delay; do not acquire source yet.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SUBSCRIBEON-SCHEDULE.

## S19-SUBSCRIBEON-CONNECT

Reach **Pending** with **matching scheduler action at/after due time**, then provide **timer.fire**.

Expect, in order: subscribe source inside scheduled action.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SUBSCRIBEON-CONNECT.

## S19-SUBSCRIBEON-PENDING-CANCEL

Reach **Pending** with **unsubscribe before scheduled action runs**, then provide **cancel**.

Expect, in order: cancel scheduler action; never subscribe source.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SUBSCRIBEON-PENDING-CANCEL.

## S19-SUBSCRIBEON-NEXT

Reach **Active** with **scheduled source subscription is now live**, then provide **source.next**.

Expect, in order: forward source value immediately.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SUBSCRIBEON-NEXT.

## S19-SUBSCRIBEON-COMPLETE

Reach **Active** with **live source completes**, then provide **source.complete**.

Expect, in order: complete and release source.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SUBSCRIBEON-COMPLETE.

## S19-SUBSCRIBEON-ERROR

Reach **Active** with **live source fails**, then provide **source.error**.

Expect, in order: propagate original error and release source.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SUBSCRIBEON-ERROR.

## S19-SUBSCRIBEON-ACTIVE-CANCEL

Reach **Active** with **consumer unsubscribes after source acquisition**, then provide **cancel**.

Expect, in order: unsubscribe source silently.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SUBSCRIBEON-ACTIVE-CANCEL.
