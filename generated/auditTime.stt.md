# auditTime-3: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| AUDITTIME-INIT | Unsubscribed | subscribe | fresh valid clock | subscribe to the source | idle without a duration | S7-AUDITTIME-INIT |
| AUDITTIME-START | Idle | source.next | valid clock, fresh generation and duration deadline | schedule one timer; retain the input | pending with one scheduled duration and latest value | S7-AUDITTIME-START |
| AUDITTIME-REPLACE | Pending | source.next | duration remains active | no actions | same duration with latest input replaced | S7-AUDITTIME-REPLACE |
| AUDITTIME-COMPLETE-IDLE | Idle | source.complete | no active duration | complete downstream; release source | closed by completion | S7-AUDITTIME-COMPLETE-IDLE |
| AUDITTIME-COMPLETE-PENDING | Pending | source.complete | duration active | release completed source; retain duration | waiting for duration outcome, no new source values | S7-AUDITTIME-COMPLETE-PENDING |
| AUDITTIME-DURATION-NEXT | Pending | timer.fire | matching timer identity at or after deadline | release active duration; emit latest pending source value | idle and ready for the next source value | S7-AUDITTIME-DURATION-NEXT |
| AUDITTIME-WAITING-DURATION-NEXT | Waiting | timer.fire | matching timer identity at or after deadline | release active duration; emit latest pending source value; complete downstream | closed by delayed completion | S7-AUDITTIME-WAITING-DURATION-NEXT |
| AUDITTIME-SOURCE-ERROR-IDLE | Idle | source.error | valid clock and live execution | forward error unchanged; release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDITTIME-SOURCE-ERROR-IDLE |
| AUDITTIME-CANCEL-IDLE | Idle | cancel | valid clock and live execution | release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDITTIME-CANCEL-IDLE |
| AUDITTIME-SOURCE-ERROR-PENDING | Pending | source.error | valid clock and live execution | forward error unchanged; release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDITTIME-SOURCE-ERROR-PENDING |
| AUDITTIME-CANCEL-PENDING | Pending | cancel | valid clock and live execution | release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDITTIME-CANCEL-PENDING |
| AUDITTIME-CANCEL-WAITING | Waiting | cancel | valid clock and live execution | release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDITTIME-CANCEL-WAITING |
