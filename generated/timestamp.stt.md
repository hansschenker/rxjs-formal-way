# timestamp-external-clock: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S21-TIMESTAMP-START | Unsubscribed | subscribe | first result connection | subscribe source; do not read provider yet | Listening with previous=null and nextRead=0. | S21-TIMESTAMP-START |
| S21-TIMESTAMP-NEXT-READ | Listening | source.next | source is live and next read index can advance safely | retain exact value and request provider.now | ReadingNext with the source value and correlated read index retained. | S21-TIMESTAMP-NEXT-READ |
| S21-TIMESTAMP-NEXT-RETURN | ReadingNext | clock.return | matching read is finite | emit a fresh record containing the same value and supplied timestamp | Listening with no historical reading retained and nextRead advanced. | S21-TIMESTAMP-NEXT-RETURN |
| S21-TIMESTAMP-NEXT-THROW | ReadingNext | clock.throw | matching next-value read throws | forward exact provider error; release source without forwarding pending value | Closed error; pending value and baseline are discarded. | S21-TIMESTAMP-NEXT-THROW |
| S21-TIMESTAMP-COMPLETE | Listening | source.complete | source completes while no read is pending | complete downstream; release source; perform no clock read | Closed complete with no retained memory. | S21-TIMESTAMP-COMPLETE |
| S21-TIMESTAMP-ERROR | Listening | source.error | source fails while no read is pending | forward exact source error; release source; perform no clock read | Closed error with no retained memory. | S21-TIMESTAMP-ERROR |
| S21-TIMESTAMP-CANCEL | Listening | cancel | consumer cancels between source reactions | release source silently; perform no clock read | Closed cancel; memory discarded. | S21-TIMESTAMP-CANCEL |
