# bufferTime-4-every-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session07-buffer-rxjs.test.mjs.

## BUFFERTIME-INIT

Reach **Unsubscribed** with **fresh clock and representable initial deadlines**, then provide **subscribe**.

Expect, in order: schedule initial closing timer; schedule creation interval if configured; subscribe source.

Resulting state: active with one empty window and optional creation timer. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERTIME-INIT.

## BUFFERTIME-NEXT

Reach **Active** with **valid clock, window counter and capacity**, then provide **source.next**.

Expect, in order: append to windows open before this notification; close full windows; emit arrays in opening order; restart if no creation interval.

Resulting state: active with unfilled buffers and new timer identities. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERTIME-NEXT.

## BUFFERTIME-WINDOW-FIRE

Reach **Active** with **matching live window and due deadline**, then provide **window.fire**.

Expect, in order: cancel matching timer; emit this window, including empty; restart if no creation interval.

Resulting state: active with remaining windows and optional new window. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERTIME-WINDOW-FIRE.

## BUFFERTIME-SOURCE-COMPLETE

Reach **Active** with **valid clock**, then provide **source.complete**.

Expect, in order: emit all remaining buffers in opening order; complete downstream; cancel timers and release source.

Resulting state: closed with no active windows. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERTIME-SOURCE-COMPLETE.

## BUFFERTIME-SOURCE-ERROR

Reach **Active** with **valid clock**, then provide **source.error**.

Expect, in order: forward source error unchanged; cancel timers and discard all buffered values; release source.

Resulting state: closed because of error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERTIME-SOURCE-ERROR.

## BUFFERTIME-CANCEL

Reach **Active** with **valid clock between reactions**, then provide **cancel**.

Expect, in order: cancel all timers; release source without downstream notification.

Resulting state: closed with all buffers discarded. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERTIME-CANCEL.

## BUFFERTIME-CREATION-FIRE

Reach **Active** with **matching interval generation and due scheduled creation**, then provide **creation.fire**.

Expect, in order: open another empty buffer with closing timer; schedule next creation interval.

Resulting state: active with one additional open window. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S7-BUFFERTIME-CREATION-FIRE.
