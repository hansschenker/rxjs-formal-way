# shareReplay-2-6-0: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session3-shareReplay-rxjs.test.mjs.

## SHAREREPLAY-CONNECT

Reach **Disconnected** with **fresh subscription ID and available connection generation; environment clock must not move backwards**, then provide **subscriber.subscribe**.

Expect, in order: replay the nonexpired cached values in FIFO order before the terminal notification (if any); subscribe to the source under a fresh connection generation.

Resulting state: one registered subscriber and one connection; replay memory retained, pruned or reset according to the event. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S3-SHAREREPLAY-01.

## SHAREREPLAY-JOIN

Reach **Connected** with **fresh subscription ID; environment clock must not move backwards**, then provide **subscriber.subscribe**.

Expect, in order: replay the nonexpired cached values in FIFO order before the terminal notification (if any).

Resulting state: append subscriber to the existing connection, without replay; replay memory retained, pruned or reset according to the event. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S3-SHAREREPLAY-02.

## SHAREREPLAY-NEXT

Reach **Connected** with **current source generation; environment clock must not move backwards**, then provide **source.next**.

Expect, in order: append incoming value to time/count-bounded replay memory; forward the value to each currently registered subscriber in registration order.

Resulting state: retain the connection and registry; replay memory retained, pruned or reset according to the event. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S3-SHAREREPLAY-03.

## SHAREREPLAY-LEAVE

Reach **Connected** with **registered subscriber and at least one other remains; environment clock must not move backwards**, then provide **subscriber.unsubscribe**.

Expect, in order: discard replay memory if connection resets.

Resulting state: remove only this subscriber; replay memory retained, pruned or reset according to the event. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S3-SHAREREPLAY-04.

## SHAREREPLAY-LAST-RETAIN

Reach **Connected** with **the last registered subscriber leaves; resetOnRefCountZero=false; environment clock must not move backwards**, then provide **subscriber.unsubscribe**.

Expect, in order: discard replay memory if connection resets.

Resulting state: keep the source connected with an empty subscriber registry; replay memory retained, pruned or reset according to the event. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S3-SHAREREPLAY-06.

## SHAREREPLAY-COMPLETE-RETAIN

Reach **Connected** with **current generation; resetOnComplete=false; environment clock must not move backwards**, then provide **source.complete**.

Expect, in order: send complete to each current subscriber; release the source connection.

Resulting state: retain terminal status with no live connection or registered subscribers; replay memory retained, pruned or reset according to the event. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S3-SHAREREPLAY-07.

## SHAREREPLAY-LATE-COMPLETE

Reach **Completed** with **fresh subscription ID; retained terminal Subject; environment clock must not move backwards**, then provide **subscriber.subscribe**.

Expect, in order: replay the nonexpired cached values in FIFO order before the terminal notification (if any); send the cached complete to this subscriber only.

Resulting state: remain terminated without connecting or retaining the new subscriber; replay memory retained, pruned or reset according to the event. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S3-SHAREREPLAY-09.

## SHAREREPLAY-ERROR-RESET

Reach **Connected** with **current generation; resetOnError=true; environment clock must not move backwards**, then provide **source.error**.

Expect, in order: discard replay memory if connection resets; send error to each current subscriber; release the source connection.

Resulting state: reset for a later fresh subscription; replay memory retained, pruned or reset according to the event. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S3-SHAREREPLAY-08.
