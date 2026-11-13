# publishLast-legacy-fixed-subject: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session16-rxjs.test.mjs.

## S16-PUBLISHLAST-JOIN-READY

Reach **Ready** with **new nonnegative observer id**, then provide **observer.subscribe**.

Expect, in order: register subscriber; synchronously replay variant-specific current memory.

Resulting state: Existing connection and all previous subscriber registrations remain.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PUBLISHLAST-JOIN-READY.

## S16-PUBLISHLAST-LEAVE-READY

Reach **Ready** with **observer is registered**, then provide **observer.cancel**.

Expect, in order: unsubscribe only that observer, not the source connection.

Resulting state: The Subject remains live; other observers and the source are unaffected.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PUBLISHLAST-LEAVE-READY.

## S16-PUBLISHLAST-JOIN-CONNECTED

Reach **Connected** with **new nonnegative observer id**, then provide **observer.subscribe**.

Expect, in order: register subscriber; synchronously replay variant-specific current memory.

Resulting state: Existing connection and all previous subscriber registrations remain.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PUBLISHLAST-JOIN-CONNECTED.

## S16-PUBLISHLAST-LEAVE-CONNECTED

Reach **Connected** with **observer is registered**, then provide **observer.cancel**.

Expect, in order: unsubscribe only that observer, not the source connection.

Resulting state: The Subject remains live; other observers and the source are unaffected.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PUBLISHLAST-LEAVE-CONNECTED.

## S16-PUBLISHLAST-CONNECT

Reach **Ready** with **no active upstream source connection**, then provide **connect**.

Expect, in order: acquire one source subscription.

Resulting state: Connected; source subscription generation owned by this connectable object.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PUBLISHLAST-CONNECT.

## S16-PUBLISHLAST-CONNECT-IDEMPOTENT

Reach **Connected** with **connection already live**, then provide **connect**.

Expect, in order: return existing connection, no new subscribe.

Resulting state: Same source generation and observer set.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PUBLISHLAST-CONNECT-IDEMPOTENT.

## S16-PUBLISHLAST-DISCONNECT

Reach **Connected** with **explicit upstream connection cancellation**, then provide **disconnect**.

Expect, in order: unsubscribe only the source connection, never complete subject observers.

Resulting state: Ready for a further manual connection; source generation advances.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PUBLISHLAST-DISCONNECT.

## S16-PUBLISHLAST-SOURCE-NEXT

Reach **Connected** with **notification from current source generation**, then provide **source.next**.

Expect, in order: update Subject memory according to connector; forward immediately except AsyncSubject publishLast.

Resulting state: Connected with variant-specific memory and unchanged subscriber ownership.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PUBLISHLAST-SOURCE-NEXT.

## S16-PUBLISHLAST-SOURCE-COMPLETE

Reach **Connected** with **current source completed**, then provide **source.complete**.

Expect, in order: disconnect source; AsyncSubject emits last value if present; complete all current consumers.

Resulting state: Stopped successfully; no subscribed observers or upstream connection.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PUBLISHLAST-SOURCE-COMPLETE.

## S16-PUBLISHLAST-SOURCE-ERROR

Reach **Connected** with **current source fails**, then provide **source.error**.

Expect, in order: disconnect source; error every current consumer with same object.

Resulting state: Stopped in error with unchanged ReplaySubject cache; no observers.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PUBLISHLAST-SOURCE-ERROR.

## S16-PUBLISHLAST-LATE-SUBSCRIBE

Reach **Stopped** with **new nonnegative observer id**, then provide **observer.subscribe**.

Expect, in order: deliver terminal retained memory allowed by the Subject subtype; deliver terminal notification.

Resulting state: Stopped; subscriber is not retained and source is never re-acquired.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S16-PUBLISHLAST-LATE-SUBSCRIBE.
