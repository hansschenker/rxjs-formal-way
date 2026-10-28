# take-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular count.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| TAKE-INIT-ZERO | Unsubscribed | subscribe | count = 0 | complete downstream without subscribing to the source | closed because the quota is zero | M01-RX-01 |
| TAKE-INIT-POSITIVE | Unsubscribed | subscribe | count > 0 | subscribe to the source | active with seen = 0 | M01-RX-02, M01-RX-08 |
| TAKE-NEXT-PASS | Active | source.next | seen + 1 < count | forward the incoming value unchanged | active with seen increased by one | M01-RX-02, M01-RX-09 |
| TAKE-NEXT-LAST | Active | source.next | seen + 1 = count | forward the incoming value unchanged; complete downstream; release the source subscription | closed because the quota was reached | M01-RX-02, M01-RX-06, M01-RX-07 |
| TAKE-SOURCE-COMPLETE | Active | source.complete | source completes before the quota | complete downstream; release the source subscription | closed because the source completed | M01-RX-03 |
| TAKE-SOURCE-ERROR | Active | source.error | source errors before the quota | forward the source error unchanged; release the source subscription | closed because the source errored | M01-RX-04 |
| TAKE-CANCEL | Active | cancel | downstream cancels before termination | release the source subscription without notifying downstream | closed because downstream cancelled | M01-RX-05, M01-RX-10 |
