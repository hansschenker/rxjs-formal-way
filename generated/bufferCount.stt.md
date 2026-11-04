# bufferCount-3-every-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| BUFFERCOUNT-INIT | Unsubscribed | subscribe | fresh execution | subscribe to source | no input seen and no open buffers | S7-BUFFERCOUNT-INIT |
| BUFFERCOUNT-NEXT | Active | source.next | connected with valid counter | open on stride boundary, append to all open buffers, emit and remove full buffers | advance the input counter and retain incomplete buffers | S7-BUFFERCOUNT-NEXT |
| BUFFERCOUNT-SOURCE-COMPLETE | Active | source.complete | connected | emit all remaining buffers; complete downstream; release owned subscriptions | closed and buffers discarded | S7-BUFFERCOUNT-SOURCE-COMPLETE |
| BUFFERCOUNT-SOURCE-ERROR | Active | source.error | connected | forward original source error; release subscriptions without flush | closed with buffered values discarded | S7-BUFFERCOUNT-SOURCE-ERROR |
| BUFFERCOUNT-CANCEL | Active | cancel | connected between reactions | release subscriptions with no notification | closed with buffered values discarded | S7-BUFFERCOUNT-CANCEL |
