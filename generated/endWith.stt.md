# endWith-unscheduled-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| ENDWITH-INIT | Unsubscribed | subscribe | new subscription | connect source | control and memory updated atomically; resource lifetime follows ordered actions | S11-ENDWITH-INIT |
| ENDWITH-PASS | Active | source.next | source live | forward exact source payload | control and memory updated atomically; resource lifetime follows ordered actions | S11-ENDWITH-PASS |
| ENDWITH-SUFFIX-BEGIN | Active | source.complete | source successfully completed | release source; begin synchronous suffix | control and memory updated atomically; resource lifetime follows ordered actions | S11-ENDWITH-SUFFIX-BEGIN |
| ENDWITH-SUFFIX-NEXT | Suffix | suffix.next | suffix index < number of values | emit next suffix payload | control and memory updated atomically; resource lifetime follows ordered actions | S11-ENDWITH-SUFFIX-NEXT |
| ENDWITH-SUFFIX-COMPLETE | Suffix | suffix.complete | all suffix values emitted | complete downstream | control and memory updated atomically; resource lifetime follows ordered actions | S11-ENDWITH-SUFFIX-COMPLETE |
| ENDWITH-ERROR | Active | source.error | source fails | forward exact error; release source; suppress suffix | control and memory updated atomically; resource lifetime follows ordered actions | S11-ENDWITH-ERROR |
| ENDWITH-CANCEL-ACTIVE | Active | cancel | cancel during source | release source silently | control and memory updated atomically; resource lifetime follows ordered actions | S11-ENDWITH-CANCEL-ACTIVE |
| ENDWITH-CANCEL-SUFFIX | Suffix | cancel | cancel between suffix emissions | stop suffix without completion | control and memory updated atomically; resource lifetime follows ordered actions | S11-ENDWITH-CANCEL-SUFFIX |
