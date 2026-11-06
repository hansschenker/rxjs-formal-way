# concat-2-observable-inputs: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| CONCAT-INIT | Unsubscribed | subscribe | first downstream connection | acquire source index zero | valid ordered input bindings | S9-CONCAT-INIT |
| CONCAT-NEXT | Active | input.next | only active input | forward value unchanged | valid ordered input bindings | S9-CONCAT-NEXT |
| CONCAT-COMPLETE-ADVANCE | Active | input.complete | next input exists | release current input; connect next source | valid ordered input bindings | S9-CONCAT-COMPLETE-ADVANCE |
| CONCAT-COMPLETE-LAST | Active | input.complete | last input has completed | complete downstream; release final input | terminal; resources discarded | S9-CONCAT-COMPLETE-LAST |
| CONCAT-ERROR | Active | input.error | currently subscribed input | propagate original error; cancel all active inputs | terminal; resources discarded | S9-CONCAT-ERROR |
| CONCAT-CANCEL | Active | cancel | downstream cancels | unsubscribe active inputs, no terminal output | terminal; resources discarded | S9-CONCAT-CANCEL |
