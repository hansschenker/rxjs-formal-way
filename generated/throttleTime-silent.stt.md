# throttleTime-00-4: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S20-THROTTLETIME-START | Unsubscribed | subscribe | first result connection; valid nondecreasing supplied time | subscribe source; create no duration yet | Open with empty pending memory and next duration generation zero. | S20-THROTTLETIME-START |
| S20-THROTTLETIME-OPEN-NEXT | Open | source.next | no active duration; leading=false; valid nondecreasing supplied time | remember incoming value without output; schedule the next duration action | Duration generation advances; this value is pending for a possible trailing output. | S20-THROTTLETIME-OPEN-NEXT |
| S20-THROTTLETIME-REMEMBER | Throttled | source.next | a duration is active; valid nondecreasing supplied time | replace pending value without restarting duration or emitting | Same duration generation/deadline; pending presence=true with newest payload. | S20-THROTTLETIME-REMEMBER |
| S20-THROTTLETIME-END-OPEN | Throttled | timer.fire | current duration ends; trailing=false; valid nondecreasing supplied time | release current duration; emit nothing | Open with no active duration; preserve any un-emitted internal memory until replaced. | S20-THROTTLETIME-END-OPEN |
| S20-THROTTLETIME-COMPLETE-OPEN | Open | source.complete | source completes with no active duration; valid nondecreasing supplied time | complete result without flushing retained value; release source | Closed complete; all pending memory discarded. | S20-THROTTLETIME-COMPLETE-OPEN |
| S20-THROTTLETIME-COMPLETE-NOW | Throttled | source.complete | trailing=false; valid nondecreasing supplied time | complete result immediately; release source; release active duration | Closed complete; no pending value is emitted. | S20-THROTTLETIME-COMPLETE-NOW |
| S20-THROTTLETIME-SOURCE-ERROR-OPEN | Open | source.error | source fails; valid nondecreasing supplied time | forward exact source error; release source and any active duration without flushing | Closed error; pending value discarded. | S20-THROTTLETIME-SOURCE-ERROR-OPEN |
| S20-THROTTLETIME-SOURCE-ERROR-THROTTLED | Throttled | source.error | source fails; valid nondecreasing supplied time | forward exact source error; release source and any active duration without flushing | Closed error; pending value discarded. | S20-THROTTLETIME-SOURCE-ERROR-THROTTLED |
| S20-THROTTLETIME-CANCEL-OPEN | Open | cancel | consumer cancels this execution; valid nondecreasing supplied time | release only still-owned source/duration resources; emit nothing | Closed cancel; clear all memory. | S20-THROTTLETIME-CANCEL-OPEN |
| S20-THROTTLETIME-CANCEL-THROTTLED | Throttled | cancel | consumer cancels this execution; valid nondecreasing supplied time | release only still-owned source/duration resources; emit nothing | Closed cancel; clear all memory. | S20-THROTTLETIME-CANCEL-THROTTLED |
