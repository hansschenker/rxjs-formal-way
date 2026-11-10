# isEmpty-short-circuit: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S13-ISEMPTY-INIT | Unsubscribed | subscribe | new result subscription | subscribe source | updated control and subscription-local memory | S13-ISEMPTY-INIT |
| S13-ISEMPTY-NONEMPTY | Active | source.next | first next value | emit false; complete; unsubscribe source | terminal with no owned work | S13-ISEMPTY-NONEMPTY |
| S13-ISEMPTY-EMPTY | Active | source.complete | source completed before next | emit true; complete; release source | terminal with no owned work | S13-ISEMPTY-EMPTY |
| S13-ISEMPTY-ERROR | Active | source.error | error before first next | forward same error; release source | terminal with no owned work | S13-ISEMPTY-ERROR |
| S13-ISEMPTY-CANCEL | Active | cancel | consumer closes before result | release source silently | terminal with no owned work | S13-ISEMPTY-CANCEL |
