# ignoreElements-discard-next: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S13-IGNOREELEMENTS-INIT | Unsubscribed | subscribe | new result subscription | subscribe source | updated control and subscription-local memory | S13-IGNOREELEMENTS-INIT |
| S13-IGNOREELEMENTS-DROP | Active | source.next | every source value | no downstream next | updated control and subscription-local memory | S13-IGNOREELEMENTS-DROP |
| S13-IGNOREELEMENTS-COMPLETE | Active | source.complete | normal termination | forward complete; release source | terminal with no owned work | S13-IGNOREELEMENTS-COMPLETE |
| S13-IGNOREELEMENTS-ERROR | Active | source.error | failure | forward identical error; release source | terminal with no owned work | S13-IGNOREELEMENTS-ERROR |
| S13-IGNOREELEMENTS-CANCEL | Active | cancel | downstream unsubscribed | release source silently | terminal with no owned work | S13-IGNOREELEMENTS-CANCEL |
