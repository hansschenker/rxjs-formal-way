# mapTo-constant: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S13-MAPTO-INIT | Unsubscribed | subscribe | new subscription | subscribe source | updated control and subscription-local memory | S13-MAPTO-INIT |
| S13-MAPTO-REPLACE | Active | source.next | every input next | emit original constant instance | updated control and subscription-local memory | S13-MAPTO-REPLACE |
| S13-MAPTO-COMPLETE | Active | source.complete | source completes | complete; release source | terminal with no owned work | S13-MAPTO-COMPLETE |
| S13-MAPTO-ERROR | Active | source.error | source errors | forward error; release source | terminal with no owned work | S13-MAPTO-ERROR |
| S13-MAPTO-CANCEL | Active | cancel | downstream cancels | release source silently | terminal with no owned work | S13-MAPTO-CANCEL |
