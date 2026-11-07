# defaultIfEmpty-opaque-fallback: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| DEFAULTIFEMPTY-INIT | Unsubscribed | subscribe | new subscription | acquire source | state with documented resource ownership | S10-DEFAULTIFEMPTY-INIT |
| DEFAULTIFEMPTY-NEXT | Active | source.next | source live | remember that at least one value arrived; forward exact value | state with documented resource ownership | S10-DEFAULTIFEMPTY-NEXT |
| DEFAULTIFEMPTY-EMPTY | Active | source.complete | no source value was seen | emit configured fallback once; complete; release source | terminated; no late events legal | S10-DEFAULTIFEMPTY-EMPTY |
| DEFAULTIFEMPTY-NONEMPTY | Active | source.complete | some source next was seen | complete without fallback; release source | terminated; no late events legal | S10-DEFAULTIFEMPTY-NONEMPTY |
| DEFAULTIFEMPTY-ERROR | Active | source.error | source errored | forward exact error; release source; no fallback | terminated; no late events legal | S10-DEFAULTIFEMPTY-ERROR |
| DEFAULTIFEMPTY-CANCEL | Active | cancel | downstream unsubscribed | release source silently | terminated; no late events legal | S10-DEFAULTIFEMPTY-CANCEL |
