# sampleTime-source-first-3: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S18-SAMPLETIME-START | Unsubscribed | subscribe | first result subscription | subscribe source; schedule first virtual tick | Listening with no remembered value and one sampling mechanism. | S18-SAMPLETIME-START |
| S18-SAMPLETIME-REMEMBER | Listening | source.next | live source emission (any payload) | replace remembered value with exact payload; no downstream notification | hasValue=true; lastValue replaced. | S18-SAMPLETIME-REMEMBER |
| S18-SAMPLETIME-TICK-EMIT | Listening | timer.fire | current scheduled tick reaches due time; hasValue=true | emit latest unsampled value; schedule following tick | No pending value and next periodic tick advances. | S18-SAMPLETIME-TICK-EMIT |
| S18-SAMPLETIME-TICK-EMPTY | Listening | timer.fire | current scheduled tick reaches due time; hasValue=false | schedule following tick without output | No pending value and next periodic tick advances. | S18-SAMPLETIME-TICK-EMPTY |
| S18-SAMPLETIME-COMPLETE | Listening | source.complete | source completes | complete immediately, without flushing pending value; release source and sampling mechanism | Closed complete. | S18-SAMPLETIME-COMPLETE |
| S18-SAMPLETIME-ERROR | Listening | source.error | source fails | forward exact error immediately; release source and sampling mechanism | Closed error. | S18-SAMPLETIME-ERROR |
| S18-SAMPLETIME-CANCEL | Listening | cancel | consumer cancels | release subscriptions or timer; never notify | Closed cancel. | S18-SAMPLETIME-CANCEL |
