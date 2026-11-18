# timeInterval-external-clock: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S21-TIMEINTERVAL-START-READ | Unsubscribed | subscribe | first result connection | request scheduler.now before source acquisition | ReadingStart for read zero; no source subscription exists yet. | S21-TIMEINTERVAL-START-READ |
| S21-TIMEINTERVAL-START-RETURN | ReadingStart | clock.return | matching initial read returns a finite number | subscribe source | Listening with previous=reading and nextRead=1. | S21-TIMEINTERVAL-START-RETURN |
| S21-TIMEINTERVAL-START-THROW | ReadingStart | clock.throw | matching initial read throws | forward exact provider error without acquiring source | Closed error; no source resource requires release. | S21-TIMEINTERVAL-START-THROW |
| S21-TIMEINTERVAL-NEXT-READ | Listening | source.next | source is live and next read index can advance safely | retain exact value and request provider.now | ReadingNext with the source value and correlated read index retained. | S21-TIMEINTERVAL-NEXT-READ |
| S21-TIMEINTERVAL-NEXT-RETURN | ReadingNext | clock.return | matching read is finite and reading minus previous remains finite | emit a fresh record containing the same value and reading minus previous | Listening with previous replaced by this reading and nextRead advanced. | S21-TIMEINTERVAL-NEXT-RETURN |
| S21-TIMEINTERVAL-NEXT-THROW | ReadingNext | clock.throw | matching next-value read throws | forward exact provider error; release source without forwarding pending value | Closed error; pending value and baseline are discarded. | S21-TIMEINTERVAL-NEXT-THROW |
| S21-TIMEINTERVAL-COMPLETE | Listening | source.complete | source completes while no read is pending | complete downstream; release source; perform no clock read | Closed complete with no retained memory. | S21-TIMEINTERVAL-COMPLETE |
| S21-TIMEINTERVAL-ERROR | Listening | source.error | source fails while no read is pending | forward exact source error; release source; perform no clock read | Closed error with no retained memory. | S21-TIMEINTERVAL-ERROR |
| S21-TIMEINTERVAL-CANCEL | Listening | cancel | consumer cancels between source reactions | release source silently; perform no clock read | Closed cancel; memory discarded. | S21-TIMEINTERVAL-CANCEL |
