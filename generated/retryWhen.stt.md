# retryWhen-persistent-errors-notifier: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S18-RETRYWHEN-START | Unsubscribed | subscribe | first result subscription | subscribe source generation 0 | Active with no notifier. | S18-RETRYWHEN-START |
| S18-RETRYWHEN-FORWARD | Active | source.next | current source generation sends a value | forward original payload exactly once | Same current source and notifier state. | S18-RETRYWHEN-FORWARD |
| S18-RETRYWHEN-FIRST-ERROR | Active | source.error | matching source error and notifier absent | release errored source; subscribe to persistent notifier; send original error to errors Subject | Waiting for notifier next, complete or error. | S18-RETRYWHEN-FIRST-ERROR |
| S18-RETRYWHEN-LATER-ERROR | Active | source.error | matching source error and notifier already open | release errored source; notify original error on existing Subject | Waiting for the next notifier decision. | S18-RETRYWHEN-LATER-ERROR |
| S18-RETRYWHEN-RETRY | Waiting | notifier.next | one notifier next while source is stopped | subscribe fresh source generation | Active with next source generation; notifier remains open. | S18-RETRYWHEN-RETRY |
| S18-RETRYWHEN-NOTIFIER-COMPLETE-ACTIVE | Active | notifier.complete | open notifier completes | complete downstream; release all live resources | Closed successfully. | S18-RETRYWHEN-NOTIFIER-COMPLETE-ACTIVE |
| S18-RETRYWHEN-NOTIFIER-ERROR-ACTIVE | Active | notifier.error | open notifier errors | forward exact notifier error; release active source and notifier | Closed on notifier error. | S18-RETRYWHEN-NOTIFIER-ERROR-ACTIVE |
| S18-RETRYWHEN-CANCEL-ACTIVE | Active | cancel | consumer cancels | release source if live; release notifier if already allocated; no output notification | Closed cancel. | S18-RETRYWHEN-CANCEL-ACTIVE |
| S18-RETRYWHEN-NOTIFIER-COMPLETE-WAITING | Waiting | notifier.complete | open notifier completes | complete downstream; release all live resources | Closed successfully. | S18-RETRYWHEN-NOTIFIER-COMPLETE-WAITING |
| S18-RETRYWHEN-NOTIFIER-ERROR-WAITING | Waiting | notifier.error | open notifier errors | forward exact notifier error; release active source and notifier | Closed on notifier error. | S18-RETRYWHEN-NOTIFIER-ERROR-WAITING |
| S18-RETRYWHEN-CANCEL-WAITING | Waiting | cancel | consumer cancels | release source if live; release notifier if already allocated; no output notification | Closed cancel. | S18-RETRYWHEN-CANCEL-WAITING |
| S18-RETRYWHEN-SOURCE-COMPLETE | Active | source.complete | matching source generation completes | complete downstream; release source and notifier if present | Closed complete. | S18-RETRYWHEN-SOURCE-COMPLETE |
