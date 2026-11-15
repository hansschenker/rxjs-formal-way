# sample-source-first-notifier: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S18-SAMPLE-START | Unsubscribed | subscribe | first result subscription | subscribe source before notifier | Listening with no remembered value and one sampling mechanism. | S18-SAMPLE-START |
| S18-SAMPLE-REMEMBER | Listening | source.next | live source emission (any payload) | replace remembered value with exact payload; no downstream notification | hasValue=true; lastValue replaced. | S18-SAMPLE-REMEMBER |
| S18-SAMPLE-NOTIFIER-EMIT | Listening | notifier.next | notifier next with pending value | emit latest value once and clear presence | Clear remembered presence on every sample. | S18-SAMPLE-NOTIFIER-EMIT |
| S18-SAMPLE-NOTIFIER-EMPTY | Listening | notifier.next | notifier next with no value since last sample | do not emit | Clear remembered presence on every sample. | S18-SAMPLE-NOTIFIER-EMPTY |
| S18-SAMPLE-NOTIFIER-COMPLETE | Listening | notifier.complete | notifier is open; completion is not a sampling notification | release notifier; do not flush latest value or terminate source | Source continues with notifier completed and unsampled memory retained. | S18-SAMPLE-NOTIFIER-COMPLETE |
| S18-SAMPLE-NOTIFIER-ERROR | Listening | notifier.error | notifier is open | forward exact error; teardown source and notifier | Closed on error. | S18-SAMPLE-NOTIFIER-ERROR |
| S18-SAMPLE-COMPLETE | Listening | source.complete | source completes | complete immediately, without flushing pending value; release source and sampling mechanism | Closed complete. | S18-SAMPLE-COMPLETE |
| S18-SAMPLE-ERROR | Listening | source.error | source fails | forward exact error immediately; release source and sampling mechanism | Closed error. | S18-SAMPLE-ERROR |
| S18-SAMPLE-CANCEL | Listening | cancel | consumer cancels | release subscriptions or timer; never notify | Closed cancel. | S18-SAMPLE-CANCEL |
