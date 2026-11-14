# retry-bounded-restart-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S17-RETRY-START | Unsubscribed | subscribe | first downstream subscription | subscribe source generation 0 | Active with attempt=1 and failure counter=0. | S17-RETRY-START |
| S17-RETRY-NEXT | Active | source.next | matching live source generation | forward value unchanged | Remain Active with the current generation and updated failure counter. | S17-RETRY-NEXT |
| S17-RETRY-COMPLETE | Active | source.complete | successful source completion | complete downstream and release source | Closed complete. | S17-RETRY-COMPLETE |
| S17-RETRY-RETRY | Active | source.error | matching source and failureCount<count | release failed source; subscribe next source execution | New generation active; failure counter and attempt incremented. | S17-RETRY-RETRY |
| S17-RETRY-RETRY-EXHAUSTED | Active | source.error | matching error and retry budget exhausted | emit original error unchanged; dispose final source | Closed in error. | S17-RETRY-RETRY-EXHAUSTED |
| S17-RETRY-CANCEL | Active | cancel | downstream cancels active subscription | release current source without an output notification | Closed cancel. | S17-RETRY-CANCEL |
