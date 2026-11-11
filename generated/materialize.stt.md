# materialize-notifications: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S14-MATERIALIZE-INIT | Unsubscribed | subscribe | first consumer subscription | subscribe source | one subscribed source | S14-MATERIALIZE-INIT |
| S14-MATERIALIZE-NEXT | Active | source.next | source next value, including undefined | emit N Notification as next | one subscribed source | S14-MATERIALIZE-NEXT |
| S14-MATERIALIZE-END | Active | source.complete | source completes normally | emit C Notification as next; complete output; release source | no owned source and no legal late events | S14-MATERIALIZE-END |
| S14-MATERIALIZE-FAIL | Active | source.error | source errors | emit E Notification as next; complete output; release source | no owned source and no legal late events | S14-MATERIALIZE-FAIL |
| S14-MATERIALIZE-CANCEL | Active | cancel | consumer cancels | release source without notifications | no owned source and no legal late events | S14-MATERIALIZE-CANCEL |
