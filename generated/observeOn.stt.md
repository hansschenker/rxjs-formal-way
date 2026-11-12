# observeOn-virtual-fifo-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S15-OBSERVEON-INIT | Unsubscribed | subscribe | first subscription | subscribe source | ordered notifications and source ownership retained | S15-OBSERVEON-INIT |
| S15-OBSERVEON-QUEUE-NEXT | Active | source.next | source live and time is valid | queue one scheduled next | ordered notifications and source ownership retained | S15-OBSERVEON-QUEUE-NEXT |
| S15-OBSERVEON-QUEUE-COMPLETE | Active | source.complete | source live and time valid | queue scheduled completion; release source | ordered notifications and source ownership retained | S15-OBSERVEON-QUEUE-COMPLETE |
| S15-OBSERVEON-QUEUE-ERROR | Active | source.error | source live and time valid | queue original error; release source | ordered notifications and source ownership retained | S15-OBSERVEON-QUEUE-ERROR |
| S15-OBSERVEON-FIRE-NEXT | Active | timer.fire | head scheduled notification is next and due | emit remembered payload; retire timer | ordered notifications and source ownership retained | S15-OBSERVEON-FIRE-NEXT |
| S15-OBSERVEON-FIRE-COMPLETE | Active | timer.fire | head scheduled completion is due | complete result; retire timer | terminal; no scheduled notifications remain | S15-OBSERVEON-FIRE-COMPLETE |
| S15-OBSERVEON-FIRE-ERROR | Active | timer.fire | head scheduled source error is due | forward exact original error; retire timer | terminal; no scheduled notifications remain | S15-OBSERVEON-FIRE-ERROR |
| S15-OBSERVEON-CANCEL | Active | cancel | downstream unsubscribed | cancel all scheduled actions; release live source, no terminal | terminal; no scheduled notifications remain | S15-OBSERVEON-CANCEL |
