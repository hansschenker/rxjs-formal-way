# share-111: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session2-share-rxjs.test.mjs.

## SHARE-CONNECT

Reach **Disconnected** with **fresh subscription ID and available connection generation**, then provide **subscriber.subscribe**.

Expect, in order: subscribe to the source under a fresh connection generation.

Resulting state: one registered subscriber and one connection. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S2-SHARE-01.

## SHARE-JOIN

Reach **Connected** with **fresh subscription ID**, then provide **subscriber.subscribe**.

Expect, in order: no actions.

Resulting state: append subscriber to the existing connection, without replay. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S2-SHARE-02.

## SHARE-NEXT

Reach **Connected** with **current source generation**, then provide **source.next**.

Expect, in order: forward the value to each currently registered subscriber in registration order.

Resulting state: retain the connection and registry. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S2-SHARE-03.

## SHARE-LEAVE

Reach **Connected** with **registered subscriber and at least one other remains**, then provide **subscriber.unsubscribe**.

Expect, in order: no actions.

Resulting state: remove only this subscriber. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S2-SHARE-04.

## SHARE-LAST-RESET

Reach **Connected** with **the last registered subscriber leaves; resetOnRefCountZero=true**, then provide **subscriber.unsubscribe**.

Expect, in order: unsubscribe the source.

Resulting state: reset the connection with no live subscribers. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S2-SHARE-05.

## SHARE-COMPLETE-RESET

Reach **Connected** with **current generation; resetOnComplete=true**, then provide **source.complete**.

Expect, in order: send complete to each current subscriber; release the source connection.

Resulting state: reset for a later fresh subscription. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S2-SHARE-07.

## SHARE-ERROR-RESET

Reach **Connected** with **current generation; resetOnError=true**, then provide **source.error**.

Expect, in order: send error to each current subscriber; release the source connection.

Resulting state: reset for a later fresh subscription. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S2-SHARE-08.
