# mergeWith-unbounded-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S15-MERGEWITH-INIT | Unsubscribed | subscribe | first consumer connection | subscribe source first then available others | live and pending indices respect FIFO admission | S15-MERGEWITH-INIT |
| S15-MERGEWITH-NEXT | Active | input.next | resource is currently subscribed | forward exact payload | live and pending indices respect FIFO admission | S15-MERGEWITH-NEXT |
| S15-MERGEWITH-REFILL | Active | input.complete | live input complete and pending FIFO is nonempty | release completed input; subscribe next waiting input | live and pending indices respect FIFO admission | S15-MERGEWITH-REFILL |
| S15-MERGEWITH-COMPLETE-WAIT | Active | input.complete | pending empty and other inputs live | release completed input | live and pending indices respect FIFO admission | S15-MERGEWITH-COMPLETE-WAIT |
| S15-MERGEWITH-COMPLETE-LAST | Active | input.complete | pending empty, final live input | complete result; release final input | terminal, no subscriptions | S15-MERGEWITH-COMPLETE-LAST |
| S15-MERGEWITH-ERROR | Active | input.error | any live source fails | forward exact error; release every subscribed input | terminal, no subscriptions | S15-MERGEWITH-ERROR |
| S15-MERGEWITH-CANCEL | Active | cancel | consumer unsubscribe | release all live sources, no notification | terminal, no subscriptions | S15-MERGEWITH-CANCEL |
