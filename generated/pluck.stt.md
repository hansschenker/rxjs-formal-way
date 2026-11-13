# pluck-plain-data-path: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S16-PLUCK-INIT | Unsubscribed | subscribe | first downstream connection | subscribe one source | Active with zero projected values. | S16-PLUCK-INIT |
| S16-PLUCK-NEXT | Active | source.next | plain-data property path can be read | emit one nested property value, including undefined | Active with source value count increased by one. | S16-PLUCK-NEXT |
| S16-PLUCK-COMPLETE | Active | source.complete | source completes | forward completion and release source | Closed complete; no source ownership. | S16-PLUCK-COMPLETE |
| S16-PLUCK-ERROR | Active | source.error | source errors | forward exact error and release source | Closed error; no source ownership. | S16-PLUCK-ERROR |
| S16-PLUCK-CANCEL | Active | cancel | downstream cancels | release source without notifying downstream | Closed cancelled; no source ownership. | S16-PLUCK-CANCEL |
