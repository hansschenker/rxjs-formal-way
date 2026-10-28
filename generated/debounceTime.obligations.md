# debounceTime-3: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/m02c-rxjs.test.mjs.

## DEBOUNCE-INIT

Reach **Unsubscribed** with **fresh execution and valid clock**, then provide **subscribe**.

Expect, in order: subscribe to the source; schedule no timer.

Resulting state: idle with no pending value and timer generation zero. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02C-RX-01.

## DEBOUNCE-START

Reach **Idle** with **valid clock/deadline and a fresh timer identity is available**, then provide **source.next**.

Expect, in order: schedule a timer invocation after dueTime; emit no value.

Resulting state: pending with the incoming value, its time, deadline and scheduled wake-up. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02C-RX-02, M02C-RX-10.

## DEBOUNCE-REPLACE

Reach **Pending** with **valid nondecreasing clock and representable deadline**, then provide **source.next**.

Expect, in order: no actions.

Resulting state: pending with the latest value and deadline, retaining the already scheduled invocation. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02C-RX-03, M02C-RX-04, M02C-RX-15.

## DEBOUNCE-REARM

Reach **Pending** with **matching due invocation; now < latest deadline; fresh identity available**, then provide **timer.fire**.

Expect, in order: schedule a new invocation for deadline minus now; emit no value.

Resulting state: pending with the same value and deadline and a new scheduled-invocation generation. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02C-RX-03, M02C-RX-04.

## DEBOUNCE-EMIT

Reach **Pending** with **matching due invocation; now >= latest deadline**, then provide **timer.fire**.

Expect, in order: release the active timer task; emit the pending value unchanged.

Resulting state: idle with no pending value or active timer. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02C-RX-02, M02C-RX-12, M02C-RX-15.

## DEBOUNCE-COMPLETE-IDLE

Reach **Idle** with **valid nondecreasing clock**, then provide **source.complete**.

Expect, in order: complete downstream; release the source subscription.

Resulting state: closed by complete, with no pending value or timer. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02C-RX-06.

## DEBOUNCE-ERROR-IDLE

Reach **Idle** with **valid nondecreasing clock**, then provide **source.error**.

Expect, in order: forward the source error unchanged; release the source subscription.

Resulting state: closed by error, with no pending value or timer. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02C-RX-07.

## DEBOUNCE-CANCEL-IDLE

Reach **Idle** with **valid nondecreasing clock**, then provide **cancel**.

Expect, in order: release the source subscription.

Resulting state: closed by cancel, with no pending value or timer. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02C-RX-08.

## DEBOUNCE-COMPLETE-PENDING

Reach **Pending** with **valid nondecreasing clock**, then provide **source.complete**.

Expect, in order: release the active timer task; emit the pending value unchanged; complete downstream; release the source subscription.

Resulting state: closed by complete, with no pending value or timer. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02C-RX-05.

## DEBOUNCE-ERROR-PENDING

Reach **Pending** with **valid nondecreasing clock**, then provide **source.error**.

Expect, in order: forward the source error unchanged; release the source subscription; release the active timer task and discard the pending value.

Resulting state: closed by error, with no pending value or timer. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02C-RX-07.

## DEBOUNCE-CANCEL-PENDING

Reach **Pending** with **valid nondecreasing clock**, then provide **cancel**.

Expect, in order: release the source subscription; release the active timer task and discard the pending value.

Resulting state: closed by cancel, with no pending value or timer. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02C-RX-08.
