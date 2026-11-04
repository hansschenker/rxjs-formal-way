# bufferCount-3-every-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session07-buffer-rxjs.test.mjs.

## BUFFERCOUNT-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe to source.

Resulting state: no input seen and no open buffers. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERCOUNT-INIT.

## BUFFERCOUNT-NEXT

Reach **Active** with **connected with valid counter**, then provide **source.next**.

Expect, in order: open on stride boundary, append to all open buffers, emit and remove full buffers.

Resulting state: advance the input counter and retain incomplete buffers. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERCOUNT-NEXT.

## BUFFERCOUNT-SOURCE-COMPLETE

Reach **Active** with **connected**, then provide **source.complete**.

Expect, in order: emit all remaining buffers; complete downstream; release owned subscriptions.

Resulting state: closed and buffers discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERCOUNT-SOURCE-COMPLETE.

## BUFFERCOUNT-SOURCE-ERROR

Reach **Active** with **connected**, then provide **source.error**.

Expect, in order: forward original source error; release subscriptions without flush.

Resulting state: closed with buffered values discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERCOUNT-SOURCE-ERROR.

## BUFFERCOUNT-CANCEL

Reach **Active** with **connected between reactions**, then provide **cancel**.

Expect, in order: release subscriptions with no notification.

Resulting state: closed with buffered values discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERCOUNT-CANCEL.
