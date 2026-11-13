# publishLast-legacy-fixed-subject: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S16-PUBLISHLAST-JOIN-READY | Ready | observer.subscribe | new nonnegative observer id | register subscriber; synchronously replay variant-specific current memory | Existing connection and all previous subscriber registrations remain. | S16-PUBLISHLAST-JOIN-READY |
| S16-PUBLISHLAST-LEAVE-READY | Ready | observer.cancel | observer is registered | unsubscribe only that observer, not the source connection | The Subject remains live; other observers and the source are unaffected. | S16-PUBLISHLAST-LEAVE-READY |
| S16-PUBLISHLAST-JOIN-CONNECTED | Connected | observer.subscribe | new nonnegative observer id | register subscriber; synchronously replay variant-specific current memory | Existing connection and all previous subscriber registrations remain. | S16-PUBLISHLAST-JOIN-CONNECTED |
| S16-PUBLISHLAST-LEAVE-CONNECTED | Connected | observer.cancel | observer is registered | unsubscribe only that observer, not the source connection | The Subject remains live; other observers and the source are unaffected. | S16-PUBLISHLAST-LEAVE-CONNECTED |
| S16-PUBLISHLAST-CONNECT | Ready | connect | no active upstream source connection | acquire one source subscription | Connected; source subscription generation owned by this connectable object. | S16-PUBLISHLAST-CONNECT |
| S16-PUBLISHLAST-CONNECT-IDEMPOTENT | Connected | connect | connection already live | return existing connection, no new subscribe | Same source generation and observer set. | S16-PUBLISHLAST-CONNECT-IDEMPOTENT |
| S16-PUBLISHLAST-DISCONNECT | Connected | disconnect | explicit upstream connection cancellation | unsubscribe only the source connection, never complete subject observers | Ready for a further manual connection; source generation advances. | S16-PUBLISHLAST-DISCONNECT |
| S16-PUBLISHLAST-SOURCE-NEXT | Connected | source.next | notification from current source generation | update Subject memory according to connector; forward immediately except AsyncSubject publishLast | Connected with variant-specific memory and unchanged subscriber ownership. | S16-PUBLISHLAST-SOURCE-NEXT |
| S16-PUBLISHLAST-SOURCE-COMPLETE | Connected | source.complete | current source completed | disconnect source; AsyncSubject emits last value if present; complete all current consumers | Stopped successfully; no subscribed observers or upstream connection. | S16-PUBLISHLAST-SOURCE-COMPLETE |
| S16-PUBLISHLAST-SOURCE-ERROR | Connected | source.error | current source fails | disconnect source; error every current consumer with same object | Stopped in error with unchanged ReplaySubject cache; no observers. | S16-PUBLISHLAST-SOURCE-ERROR |
| S16-PUBLISHLAST-LATE-SUBSCRIBE | Stopped | observer.subscribe | new nonnegative observer id | deliver terminal retained memory allowed by the Subject subtype; deliver terminal notification | Stopped; subscriber is not retained and source is never re-acquired. | S16-PUBLISHLAST-LATE-SUBSCRIBE |
