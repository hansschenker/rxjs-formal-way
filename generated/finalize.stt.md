# finalize-teardown-callback: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| FINALIZE-INIT | Unsubscribed | subscribe | fresh execution | subscribe source | updated control and memory | S12-FINALIZE-INIT |
| FINALIZE-PASS | Active | source.next | source live | forward exact value | updated control and memory | S12-FINALIZE-PASS |
| FINALIZE-COMPLETE | Active | source.complete | source completes | complete downstream; release source; invoke finalizer once | terminal state with no owned live work | S12-FINALIZE-COMPLETE |
| FINALIZE-ERROR | Active | source.error | source errors | error downstream; release source; invoke finalizer once | terminal state with no owned live work | S12-FINALIZE-ERROR |
| FINALIZE-CANCEL | Active | cancel | explicit unsubscribe | release source; invoke finalizer once | terminal state with no owned live work | S12-FINALIZE-CANCEL |
