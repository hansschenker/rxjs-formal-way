# withLatestFrom-2-tuple: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S22-WITHLATESTFROM-START | Unsubscribed | subscribe | no subscription exists | subscribe to each auxiliary Observable in argument order; subscribe source last | All readiness bits start false; no result is emitted until every auxiliary has a value. | S22-WITHLATESTFROM-START |
| S22-WITHLATESTFROM-AUX-NEXT | Active | aux.next | addressed auxiliary remains subscribed | update latest auxiliary value and first-value presence bit, emit nothing | Readiness changes only when all auxiliaries have emitted at least once. | S22-WITHLATESTFROM-AUX-NEXT |
| S22-WITHLATESTFROM-AUX-COMPLETE | Active | aux.complete | addressed auxiliary remains subscribed | release completed auxiliary input only | The last value/presence bit is retained; empty completion can permanently block readiness. | S22-WITHLATESTFROM-AUX-COMPLETE |
| S22-WITHLATESTFROM-AUX-ERROR | Active | aux.error | addressed auxiliary remains subscribed | error downstream with identical payload; cancel source and other live auxiliaries | Result terminates; no source value can recover auxiliary failure. | S22-WITHLATESTFROM-AUX-ERROR |
| S22-WITHLATESTFROM-SOURCE-BLOCKED | Active | source.next | at least one auxiliary has not yet produced a value | drop the source value; do not enqueue it for later replay | Latest ancillary values may still change but there is no source-triggered output. | S22-WITHLATESTFROM-SOURCE-BLOCKED |
| S22-WITHLATESTFROM-SOURCE-READY | Active | source.next | every auxiliary has previously produced at least one value | emit a fresh tuple containing current source value and latest ancillary values | Auxiliary memory remains unchanged until another auxiliary next. | S22-WITHLATESTFROM-SOURCE-READY |
| S22-WITHLATESTFROM-SOURCE-COMPLETE | Active | source.complete | source completes regardless of readiness | complete downstream; release source and any remaining auxiliaries | Closed without a final snapshot or synthetic tuple. | S22-WITHLATESTFROM-SOURCE-COMPLETE |
| S22-WITHLATESTFROM-SOURCE-ERROR | Active | source.error | source fails | error downstream with same error; release source and live auxiliaries | Closed without retries or output tuples. | S22-WITHLATESTFROM-SOURCE-ERROR |
| S22-WITHLATESTFROM-CANCEL | Active | cancel | outer downstream closes its connection | release source and all live auxiliaries, emit nothing | Closed; no retained latest values after teardown. | S22-WITHLATESTFROM-CANCEL |
