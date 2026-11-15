# refCount-publish-Subject-legacy: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session18-rxjs.test.mjs.

## S18-REFCOUNT-CONNECT

Reach **Disconnected** with **fresh subscription ID and available connection generation**, then provide **subscriber.subscribe**.

Expect, in order: subscribe to the source under a fresh connection generation.

Resulting state: one registered subscriber and one connection. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-REFCOUNT-01.

## S18-REFCOUNT-JOIN

Reach **Connected** with **fresh subscription ID**, then provide **subscriber.subscribe**.

Expect, in order: no actions.

Resulting state: append subscriber to the existing connection, without replay. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-REFCOUNT-02.

## S18-REFCOUNT-NEXT

Reach **Connected** with **current source generation**, then provide **source.next**.

Expect, in order: forward the value to each currently registered subscriber in registration order.

Resulting state: retain the connection and registry. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-REFCOUNT-03.

## S18-REFCOUNT-LEAVE

Reach **Connected** with **registered subscriber and at least one other remains**, then provide **subscriber.unsubscribe**.

Expect, in order: no actions.

Resulting state: remove only this subscriber. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-REFCOUNT-04.

## S18-REFCOUNT-LAST-RESET

Reach **Connected** with **the last registered subscriber leaves; resetOnRefCountZero=true**, then provide **subscriber.unsubscribe**.

Expect, in order: unsubscribe the source.

Resulting state: reset the connection with no live subscribers. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-REFCOUNT-05.

## S18-REFCOUNT-COMPLETE-RETAIN

Reach **Connected** with **current generation; resetOnComplete=false**, then provide **source.complete**.

Expect, in order: send complete to each current subscriber; release the source connection.

Resulting state: retain terminal status with no live connection or registered subscribers. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-REFCOUNT-07.

## S18-REFCOUNT-LATE-COMPLETE

Reach **Completed** with **fresh subscription ID; retained terminal Subject**, then provide **subscriber.subscribe**.

Expect, in order: send the cached complete to this subscriber only.

Resulting state: remain terminated without connecting or retaining the new subscriber. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-REFCOUNT-09.

## S18-REFCOUNT-ERROR-RETAIN

Reach **Connected** with **current generation; resetOnError=false**, then provide **source.error**.

Expect, in order: send error to each current subscriber; release the source connection.

Resulting state: retain terminal status with no live connection or registered subscribers. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-REFCOUNT-08.

## S18-REFCOUNT-LATE-ERROR

Reach **Errored** with **fresh subscription ID; retained terminal Subject**, then provide **subscriber.subscribe**.

Expect, in order: send the cached error to this subscriber only.

Resulting state: remain terminated without connecting or retaining the new subscriber. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-REFCOUNT-09.
