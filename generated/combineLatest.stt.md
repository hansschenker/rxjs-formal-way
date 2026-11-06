# combineLatest-1-observable-inputs: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| COMBINELATEST-INIT | Unsubscribed | subscribe | first downstream connection | acquire every input in argument order | valid ordered input bindings | S9-COMBINELATEST-INIT |
| COMBINELATEST-WAIT | Active | input.next | live source; some other source unready | replace latest value; no output | valid ordered input bindings | S9-COMBINELATEST-WAIT |
| COMBINELATEST-EMIT | Active | input.next | live source; every other source ready | update one latest value; emit copied source-ordered array | valid ordered input bindings | S9-COMBINELATEST-EMIT |
| COMBINELATEST-COMPLETE-WAIT | Active | input.complete | live source; another source remains live | release completing input; retain latest value | valid ordered input bindings | S9-COMBINELATEST-COMPLETE-WAIT |
| COMBINELATEST-COMPLETE-LAST | Active | input.complete | final live input | complete downstream; release final input | terminal; resources discarded | S9-COMBINELATEST-COMPLETE-LAST |
| COMBINELATEST-ERROR | Active | input.error | currently subscribed input | propagate original error; cancel all active inputs | terminal; resources discarded | S9-COMBINELATEST-ERROR |
| COMBINELATEST-CANCEL | Active | cancel | downstream cancels | unsubscribe active inputs, no terminal output | terminal; resources discarded | S9-COMBINELATEST-CANCEL |
