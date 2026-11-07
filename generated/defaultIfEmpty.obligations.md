# defaultIfEmpty-opaque-fallback: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session10-rxjs.test.mjs.

## DEFAULTIFEMPTY-INIT

Reach **Unsubscribed** with **new subscription**, then provide **subscribe**.

Expect, in order: acquire source.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEFAULTIFEMPTY-INIT.

## DEFAULTIFEMPTY-NEXT

Reach **Active** with **source live**, then provide **source.next**.

Expect, in order: remember that at least one value arrived; forward exact value.

Resulting state: state with documented resource ownership. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEFAULTIFEMPTY-NEXT.

## DEFAULTIFEMPTY-EMPTY

Reach **Active** with **no source value was seen**, then provide **source.complete**.

Expect, in order: emit configured fallback once; complete; release source.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEFAULTIFEMPTY-EMPTY.

## DEFAULTIFEMPTY-NONEMPTY

Reach **Active** with **some source next was seen**, then provide **source.complete**.

Expect, in order: complete without fallback; release source.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEFAULTIFEMPTY-NONEMPTY.

## DEFAULTIFEMPTY-ERROR

Reach **Active** with **source errored**, then provide **source.error**.

Expect, in order: forward exact error; release source; no fallback.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEFAULTIFEMPTY-ERROR.

## DEFAULTIFEMPTY-CANCEL

Reach **Active** with **downstream unsubscribed**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: terminated; no late events legal. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S10-DEFAULTIFEMPTY-CANCEL.
