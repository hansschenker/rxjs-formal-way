# max-default: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| AGG-MAX-DEFAULT-INIT | Unsubscribed | subscribe | fresh subscription | connect source; initialize private accumulation | Subscription allocates a fresh local aggregate; no seed or count value is emitted yet. | S6-MAX-01, S6-MAX-02 |
| AGG-MAX-DEFAULT-FIRST | Collecting | source.next | no memory and a safe source index | remember original value, no output | Without seed, the first source value becomes memory. It does not invoke a reducer or comparer. | S6-MAX-03, S6-MAX-04 |
| AGG-MAX-DEFAULT-PLAIN-COUNT | Collecting | source.next | count without predicate; safe source index | increment private count; no output | Count every source next; retain only the new count and source index. No value is emitted until completion. | S6-MAX-05 |
| AGG-MAX-DEFAULT-APPEND | Collecting | source.next | array profile; safe source index | remember one original reference in the ordered array; no output | Keep a new immutable model snapshot of the values seen so far. Native toArray owns a mutable array, but emits only after completion. | S6-MAX-05 |
| AGG-MAX-DEFAULT-CALL | Collecting | source.next | memory exists and callback is required; safe index | invoke named callback with retained arguments | Request exactly one callback, with the remembered value, incoming input and zero-based source index. No callback is run by the pure model. | S6-MAX-06, S6-MAX-07 |
| AGG-MAX-DEFAULT-RETURN | Calling | callback.return | matches pending callback identity | update aggregate from correlated callback outcome; no output | Store the reducer result, add the predicate truthiness to count, or select the extremum based on comparison sign; still emit nothing. | S6-MAX-06, S6-MAX-07, S6-MAX-08 |
| AGG-MAX-DEFAULT-THROW | Calling | callback.throw | matches pending callback identity | notify error unchanged; unsubscribe source | Callback failure forwards the exact thrown value, cancels upstream and discards the pending aggregate. | S6-MAX-09 |
| AGG-MAX-DEFAULT-COMPLETE-SOME | Collecting | source.complete | aggregate memory is present | notify final next; notify complete; unsubscribe source | Only source completion emits the final aggregate once followed by completion, then releases the source. | S6-MAX-02, S6-MAX-10 |
| AGG-MAX-DEFAULT-COMPLETE-EMPTY | Collecting | source.complete | no seed and no source values | notify complete; unsubscribe source | Empty unseeded reduce and empty min/max complete without emitting a value. | S6-MAX-02, S6-MAX-10 |
| AGG-MAX-DEFAULT-ERROR | Collecting | source.error | no unresolved callback | notify source error unchanged; unsubscribe source | Source errors discard the aggregate and preserve the original error identity; no completion follows. | S6-MAX-11 |
| AGG-MAX-DEFAULT-CANCEL | Collecting | cancel | between resolved notifications | unsubscribe source without any terminal notification | Unsubscription releases the upstream resource silently, without flushing the aggregate. | S6-MAX-12 |
