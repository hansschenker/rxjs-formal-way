# delayWhen-Observable-selectors: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| DELAYWHEN-INIT | Unsubscribed | subscribe | fresh subscription | subscribe source | state with documented resource ownership | S10-DELAYWHEN-INIT |
| DELAYWHEN-SOURCE-NEXT | Active | source.next | source live; timer mode | remember input as independent pending timer; schedule due | state with documented resource ownership | S10-DELAYWHEN-SOURCE-NEXT |
| DELAYWHEN-SOURCE-SELECT | Active | source.next | source live; selector mode | retain source value; request indexed duration selector | state with documented resource ownership | S10-DELAYWHEN-SOURCE-SELECT |
| DELAYWHEN-SELECTOR-RETURN | Active | callback.return | matching pending callback | subscribe returned duration | state with documented resource ownership | S10-DELAYWHEN-SELECTOR-RETURN |
| DELAYWHEN-SELECTOR-THROW | Active | callback.throw | matching pending callback | error; release outer and all admitted durations | terminated; no late events legal | S10-DELAYWHEN-SELECTOR-THROW |
| DELAYWHEN-TIMER-FIRE | Active | timer.fire | current timer at/after deadline; source remains live or peers pending | cancel timer; emit its source payload | state with documented resource ownership | S10-DELAYWHEN-TIMER-FIRE |
| DELAYWHEN-TIMER-FINAL | Active | timer.fire | last timer at/after deadline and source already complete | emit value; complete | terminated; no late events legal | S10-DELAYWHEN-TIMER-FINAL |
| DELAYWHEN-DURATION-NEXT-Active | Active | duration.next | matching selected duration; closed only after outer finished and last item | emit pending value after first duration next | state with documented resource ownership | S10-DELAYWHEN-DURATION-NEXT-Active |
| DELAYWHEN-DURATION-NEXT-Closed | Active | duration.next | matching selected duration; closed only after outer finished and last item | emit pending value after first duration next | terminated; no late events legal | S10-DELAYWHEN-DURATION-NEXT-Closed |
| DELAYWHEN-DURATION-EMPTY-Active | Active | duration.complete | matching selected duration; closed only after outer finished and last item | discard pending value after empty completion | state with documented resource ownership | S10-DELAYWHEN-DURATION-EMPTY-Active |
| DELAYWHEN-DURATION-EMPTY-Closed | Active | duration.complete | matching selected duration; closed only after outer finished and last item | discard pending value after empty completion | terminated; no late events legal | S10-DELAYWHEN-DURATION-EMPTY-Closed |
| DELAYWHEN-DURATION-ERROR | Active | duration.error | matching selected duration | error and release all subscriptions | terminated; no late events legal | S10-DELAYWHEN-DURATION-ERROR |
| DELAYWHEN-SOURCE-COMPLETE-WAIT | Active | source.complete | some pending duration remains | release source, await durations | state with documented resource ownership | S10-DELAYWHEN-SOURCE-COMPLETE-WAIT |
| DELAYWHEN-SOURCE-COMPLETE-EMPTY | Active | source.complete | no pending durations | complete and release source | terminated; no late events legal | S10-DELAYWHEN-SOURCE-COMPLETE-EMPTY |
| DELAYWHEN-SOURCE-ERROR | Active | source.error | source live | propagate error and cancel all pending durations | terminated; no late events legal | S10-DELAYWHEN-SOURCE-ERROR |
| DELAYWHEN-CANCEL | Active | cancel | downstream unsubscribed | cancel pending durations and live source; no terminal output | terminated; no late events legal | S10-DELAYWHEN-CANCEL |
