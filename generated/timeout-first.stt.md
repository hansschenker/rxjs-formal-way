# timeout-first-relative-4-each-none-default: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S21-TIMEOUT-START | Unsubscribed | subscribe | first connection; initial deadline remains future and representable; supplied time is a nondecreasing safe integer | subscribe source; schedule initial watchdog | Source with seen=0, lastValue=null and timer generation zero. | S21-TIMEOUT-START |
| S21-TIMEOUT-NEXT-CANCEL-TIMER | Source | source.next | a current timer is active; supplied time is a nondecreasing safe integer | cancel current timer before delivery; forward exact source value | Seen advances and no watchdog remains after the first value. | S21-TIMEOUT-NEXT-CANCEL-TIMER |
| S21-TIMEOUT-NEXT-UNARMED | Source | source.next | first-only watchdog was already satisfied; supplied time is a nondecreasing safe integer | forward exact source value | Seen advances and no watchdog remains after the first value. | S21-TIMEOUT-NEXT-UNARMED |
| S21-TIMEOUT-SOURCE-COMPLETE | Source | source.complete | source completes before watchdog delivery; supplied time is a nondecreasing safe integer | complete result; release source; cancel any current timer | Closed complete; no fallback acquisition. | S21-TIMEOUT-SOURCE-COMPLETE |
| S21-TIMEOUT-SOURCE-ERROR | Source | source.error | source fails before watchdog delivery; supplied time is a nondecreasing safe integer | forward exact source error; release source; cancel any current timer | Closed error; no factory or fallback. | S21-TIMEOUT-SOURCE-ERROR |
| S21-TIMEOUT-CANCEL-SOURCE | Source | cancel | consumer closes while source owns the connection; supplied time is a nondecreasing safe integer | release source; cancel any current timer; emit nothing | Closed cancel; no timeout factory or fallback. | S21-TIMEOUT-CANCEL-SOURCE |
| S21-TIMEOUT-EXPIRE | Source | timer.fire | current timer generation fires at or after its deadline; supplied time is a nondecreasing safe integer | release original source; cancel current timer during source finalization; invoke timeout factory with meta, seen and cleared lastValue | Choosing awaits one same-time correlated factory outcome; no source/timer remains. | S21-TIMEOUT-EXPIRE |
| S21-TIMEOUT-FACTORY-THROW | Choosing | callback.throw | matching factory throws at invocation time; supplied time is a nondecreasing safe integer | forward exact thrown error | Closed error; original source and timer were already released. | S21-TIMEOUT-FACTORY-THROW |
