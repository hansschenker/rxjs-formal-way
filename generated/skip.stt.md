# skip-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| SKIP-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the source | active at index zero | S5-SKIP-01 |
| SKIP-DROP | Active | source.next | index < count and index < MAX_SAFE_INTEGER | no actions | active with the source index increased by one | S5-SKIP-02 |
| SKIP-PASS | Active | source.next | count <= index < MAX_SAFE_INTEGER | forward the incoming value unchanged | active with the source index increased by one | S5-SKIP-02 |
| SKIP-COMPLETE | Active | source.complete | active source connection | complete downstream; release the source | closed because of complete | S5-SKIP-03 |
| SKIP-ERROR | Active | source.error | active source connection | forward the original error; release the source | closed because of source-error | S5-SKIP-03 |
| SKIP-CANCEL | Active | cancel | active source connection | release the source without notifying downstream | closed because of cancel | S5-SKIP-03 |
