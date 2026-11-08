# endWith-unscheduled-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session11-rxjs.test.mjs.

## ENDWITH-INIT

Reach **Unsubscribed** with **new subscription**, then provide **subscribe**.

Expect, in order: connect source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ENDWITH-INIT.

## ENDWITH-PASS

Reach **Active** with **source live**, then provide **source.next**.

Expect, in order: forward exact source payload.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ENDWITH-PASS.

## ENDWITH-SUFFIX-BEGIN

Reach **Active** with **source successfully completed**, then provide **source.complete**.

Expect, in order: release source; begin synchronous suffix.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ENDWITH-SUFFIX-BEGIN.

## ENDWITH-SUFFIX-NEXT

Reach **Suffix** with **suffix index < number of values**, then provide **suffix.next**.

Expect, in order: emit next suffix payload.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ENDWITH-SUFFIX-NEXT.

## ENDWITH-SUFFIX-COMPLETE

Reach **Suffix** with **all suffix values emitted**, then provide **suffix.complete**.

Expect, in order: complete downstream.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ENDWITH-SUFFIX-COMPLETE.

## ENDWITH-ERROR

Reach **Active** with **source fails**, then provide **source.error**.

Expect, in order: forward exact error; release source; suppress suffix.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ENDWITH-ERROR.

## ENDWITH-CANCEL-ACTIVE

Reach **Active** with **cancel during source**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ENDWITH-CANCEL-ACTIVE.

## ENDWITH-CANCEL-SUFFIX

Reach **Suffix** with **cancel between suffix emissions**, then provide **cancel**.

Expect, in order: stop suffix without completion.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-ENDWITH-CANCEL-SUFFIX.
