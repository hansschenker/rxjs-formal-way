# takeUntil-Observable-notifier: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session05-rxjs.test.mjs.

## TAKEUNTIL-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe to the notifier, before the source.

Resulting state: starting with an open source gate. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-SETUP.

## TAKEUNTIL-SOURCE-CONNECT

Reach **Starting** with **notifier setup returned without terminating downstream**, then provide **setup.ready**.

Expect, in order: subscribe to the source.

Resulting state: active with the existing gate and notifier-liveness state. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-SETUP.

## TAKEUNTIL-SETUP-NOTIFIER-NEXT

Reach **Starting** with **matching live notifier subscription**, then provide **notifier.next**.

Expect, in order: complete downstream; release notifier.

Resulting state: closed because notifier emitted. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-SETUP.

## TAKEUNTIL-SETUP-NOTIFIER-COMPLETE

Reach **Starting** with **matching live notifier subscription**, then provide **notifier.complete**.

Expect, in order: release notifier without completing downstream or changing the gate.

Resulting state: same gate with notifier disconnected. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-SETUP.

## TAKEUNTIL-SETUP-NOTIFIER-ERROR

Reach **Starting** with **matching live notifier subscription**, then provide **notifier.error**.

Expect, in order: forward the notifier error unchanged; release notifier.

Resulting state: closed because notifier errored. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-ERROR.

## TAKEUNTIL-LIVE-NOTIFIER-NEXT

Reach **Active** with **matching live notifier subscription**, then provide **notifier.next**.

Expect, in order: complete downstream; release notifier; release source.

Resulting state: closed because notifier emitted. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-SIGNAL.

## TAKEUNTIL-LIVE-NOTIFIER-COMPLETE

Reach **Active** with **matching live notifier subscription**, then provide **notifier.complete**.

Expect, in order: release notifier without completing downstream or changing the gate.

Resulting state: same gate with notifier disconnected. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-EMPTY.

## TAKEUNTIL-LIVE-NOTIFIER-ERROR

Reach **Active** with **matching live notifier subscription**, then provide **notifier.error**.

Expect, in order: forward the notifier error unchanged; release notifier; release source.

Resulting state: closed because notifier errored. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-ERROR.

## TAKEUNTIL-PASS

Reach **Active** with **gate is open**, then provide **source.next**.

Expect, in order: forward the source value unchanged.

Resulting state: same gate and notifier-liveness state. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-VALUES.

## TAKEUNTIL-SOURCE-COMPLETE

Reach **Active** with **source connected, regardless of gate state**, then provide **source.complete**.

Expect, in order: complete downstream; release notifier if still live, then release source.

Resulting state: closed because of source.complete. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-TERMINAL.

## TAKEUNTIL-SOURCE-ERROR

Reach **Active** with **source connected, regardless of gate state**, then provide **source.error**.

Expect, in order: forward the source error unchanged; release notifier if still live, then release source.

Resulting state: closed because of source.error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-TERMINAL.

## TAKEUNTIL-CANCEL

Reach **Active** with **source connected, regardless of gate state**, then provide **cancel**.

Expect, in order: release notifier if still live, then release source.

Resulting state: closed because of cancel. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S5-TAKEUNTIL-TERMINAL.
