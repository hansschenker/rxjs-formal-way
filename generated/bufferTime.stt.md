# bufferTime-3-restart: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| BUFFERTIME-INIT | Unsubscribed | subscribe | fresh clock and representable initial deadlines | schedule initial closing timer; schedule creation interval if configured; subscribe source | active with one empty window and optional creation timer | S7-BUFFERTIME-INIT |
| BUFFERTIME-NEXT | Active | source.next | valid clock, window counter and capacity | append to windows open before this notification; close full windows; emit arrays in opening order; restart if no creation interval | active with unfilled buffers and new timer identities | S7-BUFFERTIME-NEXT |
| BUFFERTIME-WINDOW-FIRE | Active | window.fire | matching live window and due deadline | cancel matching timer; emit this window, including empty; restart if no creation interval | active with remaining windows and optional new window | S7-BUFFERTIME-WINDOW-FIRE |
| BUFFERTIME-SOURCE-COMPLETE | Active | source.complete | valid clock | emit all remaining buffers in opening order; complete downstream; cancel timers and release source | closed with no active windows | S7-BUFFERTIME-SOURCE-COMPLETE |
| BUFFERTIME-SOURCE-ERROR | Active | source.error | valid clock | forward source error unchanged; cancel timers and discard all buffered values; release source | closed because of error | S7-BUFFERTIME-SOURCE-ERROR |
| BUFFERTIME-CANCEL | Active | cancel | valid clock between reactions | cancel all timers; release source without downstream notification | closed with all buffers discarded | S7-BUFFERTIME-CANCEL |
