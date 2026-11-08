# elementAt-2-default: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session11-rxjs.test.mjs.

## ELEMENTAT-INIT

Reach **Unsubscribed** with **valid index**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ELEMENTAT-INIT.

## ELEMENTAT-SKIP

Reach **Active** with **current index differs from requested index**, then provide **source.next**.

Expect, in order: advance index without emission.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ELEMENTAT-SKIP.

## ELEMENTAT-HIT

Reach **Active** with **current index equals requested index**, then provide **source.next**.

Expect, in order: emit same source value; complete; release source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ELEMENTAT-HIT.

## ELEMENTAT-MISSING-DEFAULT

Reach **Active** with **index not reached and default supplied**, then provide **source.complete**.

Expect, in order: emit fallback; complete; release source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ELEMENTAT-MISSING-DEFAULT.

## ELEMENTAT-MISSING-ERROR

Reach **Active** with **index not reached and no default**, then provide **source.complete**.

Expect, in order: report ArgumentOutOfRangeError; release source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ELEMENTAT-MISSING-ERROR.

## ELEMENTAT-SOURCE-ERROR

Reach **Active** with **source fails before indexed value**, then provide **source.error**.

Expect, in order: forward exact source error; release source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ELEMENTAT-SOURCE-ERROR.

## ELEMENTAT-CANCEL

Reach **Active** with **downstream closes early**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ELEMENTAT-CANCEL.
