# buffer-Observable-closing-notifier: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session07-buffer-rxjs.test.mjs.

## BUFFER-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe source, then notifier.

Resulting state: no input seen and no open buffers. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFER-INIT.

## BUFFER-NEXT

Reach **Active** with **connected with valid counter**, then provide **source.next**.

Expect, in order: append to the current buffer.

Resulting state: advance the input counter and retain incomplete buffers. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFER-NEXT.

## BUFFER-SOURCE-COMPLETE

Reach **Active** with **connected**, then provide **source.complete**.

Expect, in order: emit all remaining buffers; complete downstream; release owned subscriptions.

Resulting state: closed and buffers discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFER-SOURCE-COMPLETE.

## BUFFER-SOURCE-ERROR

Reach **Active** with **connected**, then provide **source.error**.

Expect, in order: forward original source error; release subscriptions without flush.

Resulting state: closed with buffered values discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFER-SOURCE-ERROR.

## BUFFER-CANCEL

Reach **Active** with **connected between reactions**, then provide **cancel**.

Expect, in order: release subscriptions with no notification.

Resulting state: closed with buffered values discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFER-CANCEL.

## BUFFER-NOTIFIER-NEXT

Reach **Active** with **closing notifier still active**, then provide **notifier.next**.

Expect, in order: emit the current buffer, including empty; start a fresh empty buffer.

Resulting state: active with a new empty buffer. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFER-NOTIFIER-NEXT.

## BUFFER-NOTIFIER-COMPLETE

Reach **Active** with **closing notifier still active**, then provide **notifier.complete**.

Expect, in order: release completed notifier but keep collecting source values.

Resulting state: active with the same accumulated buffer. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFER-NOTIFIER-COMPLETE.

## BUFFER-NOTIFIER-ERROR

Reach **Active** with **closing notifier still active**, then provide **notifier.error**.

Expect, in order: forward original notifier error; release subscriptions without flush.

Resulting state: closed and values discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFER-NOTIFIER-ERROR.
