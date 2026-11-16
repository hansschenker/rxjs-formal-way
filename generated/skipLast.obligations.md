# skipLast-FIFO-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session19-rxjs.test.mjs.

## S19-SKIPLAST-START

Reach **Unsubscribed** with **first subscription**, then provide **subscribe**.

Expect, in order: subscribe source with empty FIFO.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SKIPLAST-START.

## S19-SKIPLAST-IDENTITY

Reach **Active** with **count is zero**, then provide **source.next**.

Expect, in order: forward value immediately.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SKIPLAST-IDENTITY.

## S19-SKIPLAST-BUFFER

Reach **Active** with **nonzero count and FIFO is not full**, then provide **source.next**.

Expect, in order: enqueue source value silently.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SKIPLAST-BUFFER.

## S19-SKIPLAST-RELEASE-OLDEST

Reach **Active** with **positive count and FIFO already full**, then provide **source.next**.

Expect, in order: replace oldest buffered value with new source value; then emit previous oldest.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SKIPLAST-RELEASE-OLDEST.

## S19-SKIPLAST-COMPLETE

Reach **Active** with **source completes successfully**, then provide **source.complete**.

Expect, in order: drop still-buffered suffix; complete without flushing.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SKIPLAST-COMPLETE.

## S19-SKIPLAST-ERROR

Reach **Active** with **source fails**, then provide **source.error**.

Expect, in order: drop FIFO and propagate exact error; release source.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SKIPLAST-ERROR.

## S19-SKIPLAST-CANCEL

Reach **Active** with **consumer cancels**, then provide **cancel**.

Expect, in order: drop FIFO and unsubscribe silently.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SKIPLAST-CANCEL.
