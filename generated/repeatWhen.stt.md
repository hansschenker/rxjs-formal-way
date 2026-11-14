# repeatWhen-persistent-notifier-post-setup: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S17-REPEATWHEN-START | Unsubscribed | subscribe | first downstream connection | subscribe source generation 0 | Active with no notifier. | S17-REPEATWHEN-START |
| S17-REPEATWHEN-VALUE | Active | source.next | source generation is current | forward source value unchanged | Current generation and notifier state unchanged. | S17-REPEATWHEN-VALUE |
| S17-REPEATWHEN-FIRST-SOURCE-COMPLETE | Active | source.complete | current source completes, and notifier has never been constructed | unsubscribe the completed source; subscribe to single notifier; emit void to completion Subject | Waiting for first notifier next or terminal notification. | S17-REPEATWHEN-FIRST-SOURCE-COMPLETE |
| S17-REPEATWHEN-SOURCE-COMPLETE-WAIT | Active | source.complete | current source completes and notifier is still open | unsubscribe source; emit one void completion Subject signal | Waiting with the notifier still open. | S17-REPEATWHEN-SOURCE-COMPLETE-WAIT |
| S17-REPEATWHEN-SOURCE-COMPLETE-STOP | Active | source.complete | current source completes after notifier has completed | unsubscribe final source; complete downstream | Closed successfully; no source or notifier connection. | S17-REPEATWHEN-SOURCE-COMPLETE-STOP |
| S17-REPEATWHEN-RESTART | Waiting | notifier.next | notifier is open and source has completed | subscribe one new source generation | Active at next source generation. | S17-REPEATWHEN-RESTART |
| S17-REPEATWHEN-NOTIFIER-COMPLETE-WAIT | Waiting | notifier.complete | notifier completes with main source finished | unsubscribe notifier; complete downstream | Closed successfully. | S17-REPEATWHEN-NOTIFIER-COMPLETE-WAIT |
| S17-REPEATWHEN-NOTIFIER-COMPLETE-ACTIVE | Active | notifier.complete | notifier completes while restarted source is still active | release notifier without terminating current source | Active with notifier completed. | S17-REPEATWHEN-NOTIFIER-COMPLETE-ACTIVE |
| S17-REPEATWHEN-NOTIFIER-ERROR-ACTIVE | Active | notifier.error | notifier is open | forward exact notifier error; release all live resources | Closed in error. | S17-REPEATWHEN-NOTIFIER-ERROR-ACTIVE |
| S17-REPEATWHEN-CANCEL-ACTIVE | Active | cancel | downstream cancellation | dispose current source if active; dispose notifier if open; no terminal notification | Closed by cancellation. | S17-REPEATWHEN-CANCEL-ACTIVE |
| S17-REPEATWHEN-NOTIFIER-ERROR-WAITING | Waiting | notifier.error | notifier is open | forward exact notifier error; release all live resources | Closed in error. | S17-REPEATWHEN-NOTIFIER-ERROR-WAITING |
| S17-REPEATWHEN-CANCEL-WAITING | Waiting | cancel | downstream cancellation | dispose current source if active; dispose notifier if open; no terminal notification | Closed by cancellation. | S17-REPEATWHEN-CANCEL-WAITING |
| S17-REPEATWHEN-SOURCE-ERROR | Active | source.error | current source generation fails | error downstream immediately; release source and existing notifier | Closed in error. | S17-REPEATWHEN-SOURCE-ERROR |
