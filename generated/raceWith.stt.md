# raceWith-fixed-observables-atomic-subscription: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S17-RACEWITH-SUBSCRIBE | Unsubscribed | subscribe | first result subscription with valid fixed Observable inputs | subscribe source input 0 and then every additional input in order | All source subscriptions live; no winner. | S17-RACEWITH-SUBSCRIBE |
| S17-RACEWITH-FIRST-NEXT | Racing | input.next | any live input emits the first value after connection setup | unsubscribe every losing input; forward winner payload | The winning input alone remains live; its index is permanent. | S17-RACEWITH-FIRST-NEXT |
| S17-RACEWITH-WINNER-NEXT | Winner | input.next | value is from selected winner subscription | forward next value unchanged | Winner and resource identity unchanged. | S17-RACEWITH-WINNER-NEXT |
| S17-RACEWITH-EARLY-COMPLETE | Racing | input.complete | any racing input completes without a prior next | complete result; release every competing subscription | Closed successfully without a winner. | S17-RACEWITH-EARLY-COMPLETE |
| S17-RACEWITH-EARLY-ERROR | Racing | input.error | any racing input errors before any first next | forward exact error; release every competing subscription | Closed in error without a winner. | S17-RACEWITH-EARLY-ERROR |
| S17-RACEWITH-WINNER-COMPLETE | Winner | input.complete | selected winner completes | complete downstream; release winning source | Closed successfully, original winner remains recorded. | S17-RACEWITH-WINNER-COMPLETE |
| S17-RACEWITH-WINNER-ERROR | Winner | input.error | selected winner errors | forward exact error; release winning source | Closed with original winner recorded. | S17-RACEWITH-WINNER-ERROR |
| S17-RACEWITH-CANCEL-RACE | Racing | cancel | downstream cancels before a winner | unsubscribe every candidate without notifying downstream | Closed by cancellation. | S17-RACEWITH-CANCEL-RACE |
| S17-RACEWITH-CANCEL-WINNER | Winner | cancel | downstream cancels selected source | unsubscribe winner without downstream terminal notification | Closed by cancellation. | S17-RACEWITH-CANCEL-WINNER |
