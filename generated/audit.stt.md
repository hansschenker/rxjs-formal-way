# audit-Observable-duration: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| AUDIT-INIT | Unsubscribed | subscribe | fresh valid clock | subscribe to the source | idle without a duration | S7-AUDIT-INIT |
| AUDIT-START | Idle | source.next | valid clock, fresh generation and duration deadline | invoke durationSelector exactly once with this value | await the correlated duration-selector outcome | S7-AUDIT-START |
| AUDIT-REPLACE | Pending | source.next | duration remains active | no actions | same duration with latest input replaced | S7-AUDIT-REPLACE |
| AUDIT-COMPLETE-IDLE | Idle | source.complete | no active duration | complete downstream; release source | closed by completion | S7-AUDIT-COMPLETE-IDLE |
| AUDIT-COMPLETE-PENDING | Pending | source.complete | duration active | release completed source; retain duration | waiting for duration outcome, no new source values | S7-AUDIT-COMPLETE-PENDING |
| AUDIT-CALL-RETURN | Calling | callback.return | matching selector invocation | subscribe to returned duration Observable | pending with a duration subscription | S7-AUDIT-CALL-RETURN |
| AUDIT-CALL-THROW | Calling | callback.throw | matching selector invocation | forward thrown value; release source | closed by selector error | S7-AUDIT-CALL-THROW |
| AUDIT-DURATION-NEXT | Pending | duration.next | matching live duration next | release active duration; emit latest pending source value | idle and ready for the next source value | S7-AUDIT-DURATION-NEXT |
| AUDIT-DURATION-COMPLETE | Pending | duration.complete | matching duration completion without next | release ended duration without emitting a pending value | idle; next source value can start a new duration | S7-AUDIT-DURATION-COMPLETE |
| AUDIT-DURATION-ERROR | Pending | duration.error | matching live duration error | forward duration error; release owned resources | closed by duration error | S7-AUDIT-DURATION-ERROR |
| AUDIT-WAITING-DURATION-NEXT | Waiting | duration.next | matching live duration next | release active duration; emit latest pending source value; complete downstream | closed by delayed completion | S7-AUDIT-WAITING-DURATION-NEXT |
| AUDIT-WAITING-DURATION-COMPLETE | Waiting | duration.complete | matching duration completion without next | release ended duration without emitting a pending value; complete downstream | closed without a flush | S7-AUDIT-WAITING-DURATION-COMPLETE |
| AUDIT-WAITING-DURATION-ERROR | Waiting | duration.error | matching live duration error | forward duration error; release owned resources | closed by duration error | S7-AUDIT-WAITING-DURATION-ERROR |
| AUDIT-SOURCE-ERROR-IDLE | Idle | source.error | valid clock and live execution | forward error unchanged; release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDIT-SOURCE-ERROR-IDLE |
| AUDIT-CANCEL-IDLE | Idle | cancel | valid clock and live execution | release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDIT-CANCEL-IDLE |
| AUDIT-SOURCE-ERROR-CALLING | Calling | source.error | valid clock and live execution | forward error unchanged; release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDIT-SOURCE-ERROR-CALLING |
| AUDIT-CANCEL-CALLING | Calling | cancel | valid clock and live execution | release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDIT-CANCEL-CALLING |
| AUDIT-SOURCE-ERROR-PENDING | Pending | source.error | valid clock and live execution | forward error unchanged; release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDIT-SOURCE-ERROR-PENDING |
| AUDIT-CANCEL-PENDING | Pending | cancel | valid clock and live execution | release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDIT-CANCEL-PENDING |
| AUDIT-CANCEL-WAITING | Waiting | cancel | valid clock and live execution | release owned subscriptions/timer without flush | closed with pending value discarded | S7-AUDIT-CANCEL-WAITING |
