# timeoutWith-first-none-each-4-constant: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S21-TIMEOUTWITH-START | Unsubscribed | subscribe | first connection; initial deadline remains future and representable; supplied time is a nondecreasing safe integer | subscribe source; schedule initial watchdog | Source with seen=0, lastValue=null and timer generation zero. | S21-TIMEOUTWITH-START |
| S21-TIMEOUTWITH-NEXT-CANCEL-TIMER | Source | source.next | a current timer is active; supplied time is a nondecreasing safe integer | cancel current timer before delivery; forward exact source value; schedule fresh each watchdog | Seen advances, lastValue becomes input, and the fresh timer uses now+each. | S21-TIMEOUTWITH-NEXT-CANCEL-TIMER |
| S21-TIMEOUTWITH-SOURCE-COMPLETE | Source | source.complete | source completes before watchdog delivery; supplied time is a nondecreasing safe integer | complete result; release source; cancel any current timer | Closed complete; no fallback acquisition. | S21-TIMEOUTWITH-SOURCE-COMPLETE |
| S21-TIMEOUTWITH-SOURCE-ERROR | Source | source.error | source fails before watchdog delivery; supplied time is a nondecreasing safe integer | forward exact source error; release source; cancel any current timer | Closed error; no factory or fallback. | S21-TIMEOUTWITH-SOURCE-ERROR |
| S21-TIMEOUTWITH-CANCEL-SOURCE | Source | cancel | consumer closes while source owns the connection; supplied time is a nondecreasing safe integer | release source; cancel any current timer; emit nothing | Closed cancel; no timeout factory or fallback. | S21-TIMEOUTWITH-CANCEL-SOURCE |
| S21-TIMEOUTWITH-EXPIRE | Source | timer.fire | current timer generation fires at or after its deadline; supplied time is a nondecreasing safe integer | release original source; cancel current timer during source finalization; subscribe configured fallback Observable | Fallback owns the result; the source and all watchdogs are released. | S21-TIMEOUTWITH-EXPIRE |
| S21-TIMEOUTWITH-FALLBACK-NEXT | Fallback | fallback.next | notification belongs to the live fallback generation; supplied time is a nondecreasing safe integer | forward exact fallback value without scheduling | Same fallback token; source stays disconnected. | S21-TIMEOUTWITH-FALLBACK-NEXT |
| S21-TIMEOUTWITH-FALLBACK-COMPLETE | Fallback | fallback.complete | notification belongs to live fallback; supplied time is a nondecreasing safe integer | complete result; release fallback | Closed complete; no source or timer exists. | S21-TIMEOUTWITH-FALLBACK-COMPLETE |
| S21-TIMEOUTWITH-FALLBACK-ERROR | Fallback | fallback.error | notification belongs to live fallback; supplied time is a nondecreasing safe integer | forward exact fallback error; release fallback | Closed error; no source or timer exists. | S21-TIMEOUTWITH-FALLBACK-ERROR |
| S21-TIMEOUTWITH-CANCEL-FALLBACK | Fallback | cancel | consumer closes the replacement connection; supplied time is a nondecreasing safe integer | release fallback silently | Closed cancel; do not release original source twice. | S21-TIMEOUTWITH-CANCEL-FALLBACK |
