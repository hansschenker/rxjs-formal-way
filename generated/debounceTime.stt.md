# debounceTime-3: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| DEBOUNCE-INIT | Unsubscribed | subscribe | fresh execution and valid clock | subscribe to the source; schedule no timer | idle with no pending value and timer generation zero | M02C-RX-01 |
| DEBOUNCE-START | Idle | source.next | valid clock/deadline and a fresh timer identity is available | schedule a timer invocation after dueTime; emit no value | pending with the incoming value, its time, deadline and scheduled wake-up | M02C-RX-02, M02C-RX-10 |
| DEBOUNCE-REPLACE | Pending | source.next | valid nondecreasing clock and representable deadline | no actions | pending with the latest value and deadline, retaining the already scheduled invocation | M02C-RX-03, M02C-RX-04, M02C-RX-15 |
| DEBOUNCE-REARM | Pending | timer.fire | matching due invocation; now < latest deadline; fresh identity available | schedule a new invocation for deadline minus now; emit no value | pending with the same value and deadline and a new scheduled-invocation generation | M02C-RX-03, M02C-RX-04 |
| DEBOUNCE-EMIT | Pending | timer.fire | matching due invocation; now >= latest deadline | release the active timer task; emit the pending value unchanged | idle with no pending value or active timer | M02C-RX-02, M02C-RX-12, M02C-RX-15 |
| DEBOUNCE-COMPLETE-IDLE | Idle | source.complete | valid nondecreasing clock | complete downstream; release the source subscription | closed by complete, with no pending value or timer | M02C-RX-06 |
| DEBOUNCE-ERROR-IDLE | Idle | source.error | valid nondecreasing clock | forward the source error unchanged; release the source subscription | closed by error, with no pending value or timer | M02C-RX-07 |
| DEBOUNCE-CANCEL-IDLE | Idle | cancel | valid nondecreasing clock | release the source subscription | closed by cancel, with no pending value or timer | M02C-RX-08 |
| DEBOUNCE-COMPLETE-PENDING | Pending | source.complete | valid nondecreasing clock | release the active timer task; emit the pending value unchanged; complete downstream; release the source subscription | closed by complete, with no pending value or timer | M02C-RX-05 |
| DEBOUNCE-ERROR-PENDING | Pending | source.error | valid nondecreasing clock | forward the source error unchanged; release the source subscription; release the active timer task and discard the pending value | closed by error, with no pending value or timer | M02C-RX-07 |
| DEBOUNCE-CANCEL-PENDING | Pending | cancel | valid nondecreasing clock | release the source subscription; release the active timer task and discard the pending value | closed by cancel, with no pending value or timer | M02C-RX-08 |
