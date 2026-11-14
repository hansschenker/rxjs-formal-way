# repeat-bounded-restart-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S17-REPEAT-START | Unsubscribed | subscribe | first downstream subscription | subscribe source generation 0 | Active with attempt=1 and failure counter=0. | S17-REPEAT-START |
| S17-REPEAT-NEXT | Active | source.next | matching live source generation | forward value unchanged | Remain Active with the current generation and updated failure counter. | S17-REPEAT-NEXT |
| S17-REPEAT-RESTART | Active | source.complete | matching source and attempts<count | release completed source; subscribe a new source generation | New generation active with attempts incremented; old source disposed. | S17-REPEAT-RESTART |
| S17-REPEAT-FINAL-COMPLETE | Active | source.complete | matching source and attempts=count | complete result; release final source | Closed complete after the specified number of source executions. | S17-REPEAT-FINAL-COMPLETE |
| S17-REPEAT-ERROR | Active | source.error | any matching source error | forward exact error and release source | Closed in error. | S17-REPEAT-ERROR |
| S17-REPEAT-CANCEL | Active | cancel | downstream cancels active subscription | release current source without an output notification | Closed cancel. | S17-REPEAT-CANCEL |
