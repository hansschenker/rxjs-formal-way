# combineLatestWith-1-observable-inputs: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| COMBINELATESTWITH-INIT | Unsubscribed | subscribe | first downstream connection | acquire every input in argument order | valid ordered input bindings | S9-COMBINELATESTWITH-INIT |
| COMBINELATESTWITH-WAIT | Active | input.next | live source; some other source unready | replace latest value; no output | valid ordered input bindings | S9-COMBINELATESTWITH-WAIT |
| COMBINELATESTWITH-EMIT | Active | input.next | live source; every other source ready | update one latest value; emit copied source-ordered array | valid ordered input bindings | S9-COMBINELATESTWITH-EMIT |
| COMBINELATESTWITH-COMPLETE-WAIT | Active | input.complete | live source; another source remains live | release completing input; retain latest value | valid ordered input bindings | S9-COMBINELATESTWITH-COMPLETE-WAIT |
| COMBINELATESTWITH-COMPLETE-LAST | Active | input.complete | final live input | complete downstream; release final input | terminal; resources discarded | S9-COMBINELATESTWITH-COMPLETE-LAST |
| COMBINELATESTWITH-ERROR | Active | input.error | currently subscribed input | propagate original error; cancel all active inputs | terminal; resources discarded | S9-COMBINELATESTWITH-ERROR |
| COMBINELATESTWITH-CANCEL | Active | cancel | downstream cancels | unsubscribe active inputs, no terminal output | terminal; resources discarded | S9-COMBINELATESTWITH-CANCEL |
