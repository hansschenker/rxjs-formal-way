# debounce-Observable-duration: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| DEBOUNCE-INIT | Unsubscribed | subscribe | fresh subscription | subscribe source | state with documented resource ownership | S10-DEBOUNCE-INIT |
| DEBOUNCE-NEW-VALUE | Active | source.next | source live; pending duration may exist | cancel old duration if live; replace cached value; invoke duration selector | state with documented resource ownership | S10-DEBOUNCE-NEW-VALUE |
| DEBOUNCE-DURATION-RETURN | Calling | callback.return | matching pending selector invocation | subscribe selected duration Observable | state with documented resource ownership | S10-DEBOUNCE-DURATION-RETURN |
| DEBOUNCE-DURATION-THROW | Calling | callback.throw | matching selector invocation | propagate exact thrown error; release source | terminated; no late events legal | S10-DEBOUNCE-DURATION-THROW |
| DEBOUNCE-DURATION-NEXT | Active | duration.next | matching live duration | unsubscribe duration; emit cached latest value once | state with documented resource ownership | S10-DEBOUNCE-DURATION-NEXT |
| DEBOUNCE-DURATION-EMPTY | Active | duration.complete | matching live duration completed without next | release duration; retain latest value | state with documented resource ownership | S10-DEBOUNCE-DURATION-EMPTY |
| DEBOUNCE-DURATION-ERROR | Active | duration.error | matching live duration | propagate exact error; release duration and source | terminated; no late events legal | S10-DEBOUNCE-DURATION-ERROR |
| DEBOUNCE-SOURCE-COMPLETE | Active | source.complete | source completes | cancel live duration; flush cached value if present; complete; release source | terminated; no late events legal | S10-DEBOUNCE-SOURCE-COMPLETE |
| DEBOUNCE-SOURCE-ERROR-ACTIVE | Active | source.error | source errors | forward error and release owned resources | terminated; no late events legal | S10-DEBOUNCE-SOURCE-ERROR-ACTIVE |
| DEBOUNCE-CANCEL-ACTIVE | Active | cancel | downstream cancels | release active duration and source silently | terminated; no late events legal | S10-DEBOUNCE-CANCEL-ACTIVE |
| DEBOUNCE-SOURCE-ERROR-CALLING | Calling | source.error | source errors | forward error and release owned resources | terminated; no late events legal | S10-DEBOUNCE-SOURCE-ERROR-CALLING |
| DEBOUNCE-CANCEL-CALLING | Calling | cancel | downstream cancels | release active duration and source silently | terminated; no late events legal | S10-DEBOUNCE-CANCEL-CALLING |
