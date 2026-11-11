# merge-static-2-concurrency-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S14-MERGE-INIT | Unsubscribed | subscribe | first consumer connection | subscribe source first then available others | live and pending indices respect FIFO admission | S14-MERGE-INIT |
| S14-MERGE-NEXT | Active | input.next | resource is currently subscribed | forward exact payload | live and pending indices respect FIFO admission | S14-MERGE-NEXT |
| S14-MERGE-REFILL | Active | input.complete | live input complete and pending FIFO is nonempty | release completed input; subscribe next waiting input | live and pending indices respect FIFO admission | S14-MERGE-REFILL |
| S14-MERGE-COMPLETE-WAIT | Active | input.complete | pending empty and other inputs live | release completed input | live and pending indices respect FIFO admission | S14-MERGE-COMPLETE-WAIT |
| S14-MERGE-COMPLETE-LAST | Active | input.complete | pending empty, final live input | complete result; release final input | terminal, no subscriptions | S14-MERGE-COMPLETE-LAST |
| S14-MERGE-ERROR | Active | input.error | any live source fails | forward exact error; release every subscribed input | terminal, no subscriptions | S14-MERGE-ERROR |
| S14-MERGE-CANCEL | Active | cancel | consumer unsubscribe | release all live sources, no notification | terminal, no subscriptions | S14-MERGE-CANCEL |
