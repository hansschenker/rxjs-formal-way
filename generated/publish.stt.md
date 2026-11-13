# publish-legacy-fixed-subject: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S16-PUBLISH-JOIN-READY | Ready | observer.subscribe | new nonnegative observer id | register subscriber; synchronously replay variant-specific current memory | Existing connection and all previous subscriber registrations remain. | S16-PUBLISH-JOIN-READY |
| S16-PUBLISH-LEAVE-READY | Ready | observer.cancel | observer is registered | unsubscribe only that observer, not the source connection | The Subject remains live; other observers and the source are unaffected. | S16-PUBLISH-LEAVE-READY |
| S16-PUBLISH-JOIN-CONNECTED | Connected | observer.subscribe | new nonnegative observer id | register subscriber; synchronously replay variant-specific current memory | Existing connection and all previous subscriber registrations remain. | S16-PUBLISH-JOIN-CONNECTED |
| S16-PUBLISH-LEAVE-CONNECTED | Connected | observer.cancel | observer is registered | unsubscribe only that observer, not the source connection | The Subject remains live; other observers and the source are unaffected. | S16-PUBLISH-LEAVE-CONNECTED |
| S16-PUBLISH-CONNECT | Ready | connect | no active upstream source connection | acquire one source subscription | Connected; source subscription generation owned by this connectable object. | S16-PUBLISH-CONNECT |
| S16-PUBLISH-CONNECT-IDEMPOTENT | Connected | connect | connection already live | return existing connection, no new subscribe | Same source generation and observer set. | S16-PUBLISH-CONNECT-IDEMPOTENT |
| S16-PUBLISH-DISCONNECT | Connected | disconnect | explicit upstream connection cancellation | unsubscribe only the source connection, never complete subject observers | Ready for a further manual connection; source generation advances. | S16-PUBLISH-DISCONNECT |
| S16-PUBLISH-SOURCE-NEXT | Connected | source.next | notification from current source generation | update Subject memory according to connector; forward immediately except AsyncSubject publishLast | Connected with variant-specific memory and unchanged subscriber ownership. | S16-PUBLISH-SOURCE-NEXT |
| S16-PUBLISH-SOURCE-COMPLETE | Connected | source.complete | current source completed | disconnect source; AsyncSubject emits last value if present; complete all current consumers | Stopped successfully; no subscribed observers or upstream connection. | S16-PUBLISH-SOURCE-COMPLETE |
| S16-PUBLISH-SOURCE-ERROR | Connected | source.error | current source fails | disconnect source; error every current consumer with same object | Stopped in error with unchanged ReplaySubject cache; no observers. | S16-PUBLISH-SOURCE-ERROR |
| S16-PUBLISH-LATE-SUBSCRIBE | Stopped | observer.subscribe | new nonnegative observer id | deliver terminal retained memory allowed by the Subject subtype; deliver terminal notification | Stopped; subscriber is not retained and source is never re-acquired. | S16-PUBLISH-LATE-SUBSCRIBE |
