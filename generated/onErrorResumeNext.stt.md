# onErrorResumeNext-pipeable-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S15-ONERRORRESUMENEXT-INIT | Unsubscribed | subscribe | first subscription | connect piped source index 0 | one current subscription; others waiting | S15-ONERRORRESUMENEXT-INIT |
| S15-ONERRORRESUMENEXT-NEXT | Active | input.next | matching current source | forward opaque input value | one current subscription; others waiting | S15-ONERRORRESUMENEXT-NEXT |
| S15-ONERRORRESUMENEXT-COMPLETE-ADVANCE | Active | input.complete | current input terminal and one later input remains | release current; subscribe next input | one current subscription; others waiting | S15-ONERRORRESUMENEXT-COMPLETE-ADVANCE |
| S15-ONERRORRESUMENEXT-COMPLETE-LAST | Active | input.complete | final current input terminates | release final input; complete result without propagating error | all source subscriptions released | S15-ONERRORRESUMENEXT-COMPLETE-LAST |
| S15-ONERRORRESUMENEXT-ERROR-ADVANCE | Active | input.error | current input terminal and one later input remains | release current; subscribe next input | one current subscription; others waiting | S15-ONERRORRESUMENEXT-ERROR-ADVANCE |
| S15-ONERRORRESUMENEXT-ERROR-LAST | Active | input.error | final current input terminates | release final input; complete result without propagating error | all source subscriptions released | S15-ONERRORRESUMENEXT-ERROR-LAST |
| S15-ONERRORRESUMENEXT-CANCEL | Active | cancel | downstream cancellation | unsubscribe current; no output terminal | all source subscriptions released | S15-ONERRORRESUMENEXT-CANCEL |
