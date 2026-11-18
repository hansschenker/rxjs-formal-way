# throttle-00: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S20-THROTTLE-START | Unsubscribed | subscribe | first result connection; valid nondecreasing supplied time | subscribe source; create no duration yet | Open with empty pending memory and next duration generation zero. | S20-THROTTLE-START |
| S20-THROTTLE-OPEN-NEXT | Open | source.next | no active duration; leading=false; valid nondecreasing supplied time | remember incoming value without output; invoke duration selector with that value | Duration generation advances; this value is pending for a possible trailing output. | S20-THROTTLE-OPEN-NEXT |
| S20-THROTTLE-SELECTOR-RETURN | Selecting | callback.return | current selector invocation returns a valid Observable token at the same time; valid nondecreasing supplied time | subscribe returned duration Observable | Throttled with the current generation, returned token and unchanged pending memory. | S20-THROTTLE-SELECTOR-RETURN |
| S20-THROTTLE-SELECTOR-THROW | Selecting | callback.throw | current selector invocation throws at the same time; valid nondecreasing supplied time | forward exact selector error; release source | Closed error; do not acquire a duration. | S20-THROTTLE-SELECTOR-THROW |
| S20-THROTTLE-REMEMBER | Throttled | source.next | a duration is active; valid nondecreasing supplied time | replace pending value without restarting duration or emitting | Same duration generation/deadline; pending presence=true with newest payload. | S20-THROTTLE-REMEMBER |
| S20-THROTTLE-END-OPEN | Throttled | duration.next | current duration ends; trailing=false; valid nondecreasing supplied time | release current duration; emit nothing | Open with no active duration; preserve any un-emitted internal memory until replaced. | S20-THROTTLE-END-OPEN |
| S20-THROTTLE-DURATION-EMPTY | Throttled | duration.complete | current duration completes without a next; valid nondecreasing supplied time | release completed duration; do not flush pending value | Open; the pending reference is retained internally, not emitted. | S20-THROTTLE-DURATION-EMPTY |
| S20-THROTTLE-COMPLETE-OPEN | Open | source.complete | source completes with no active duration; valid nondecreasing supplied time | complete result without flushing retained value; release source | Closed complete; all pending memory discarded. | S20-THROTTLE-COMPLETE-OPEN |
| S20-THROTTLE-COMPLETE-NOW | Throttled | source.complete | trailing=false; valid nondecreasing supplied time | complete result immediately; release source; release active duration | Closed complete; no pending value is emitted. | S20-THROTTLE-COMPLETE-NOW |
| S20-THROTTLE-SOURCE-ERROR-OPEN | Open | source.error | source fails; valid nondecreasing supplied time | forward exact source error; release source and any active duration without flushing | Closed error; pending value discarded. | S20-THROTTLE-SOURCE-ERROR-OPEN |
| S20-THROTTLE-SOURCE-ERROR-THROTTLED | Throttled | source.error | source fails; valid nondecreasing supplied time | forward exact source error; release source and any active duration without flushing | Closed error; pending value discarded. | S20-THROTTLE-SOURCE-ERROR-THROTTLED |
| S20-THROTTLE-CANCEL-OPEN | Open | cancel | consumer cancels this execution; valid nondecreasing supplied time | release only still-owned source/duration resources; emit nothing | Closed cancel; clear all memory. | S20-THROTTLE-CANCEL-OPEN |
| S20-THROTTLE-CANCEL-THROTTLED | Throttled | cancel | consumer cancels this execution; valid nondecreasing supplied time | release only still-owned source/duration resources; emit nothing | Closed cancel; clear all memory. | S20-THROTTLE-CANCEL-THROTTLED |
| S20-THROTTLE-DURATION-ERROR-THROTTLED | Throttled | duration.error | currently owned duration fails; valid nondecreasing supplied time | forward exact duration error; release still-live source and duration without flushing | Closed error; pending value discarded. | S20-THROTTLE-DURATION-ERROR-THROTTLED |
