# buffer-Observable-closing-notifier: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| BUFFER-INIT | Unsubscribed | subscribe | fresh execution | subscribe source, then notifier | no input seen and no open buffers | S7-BUFFER-INIT |
| BUFFER-NEXT | Active | source.next | connected with valid counter | append to the current buffer | advance the input counter and retain incomplete buffers | S7-BUFFER-NEXT |
| BUFFER-SOURCE-COMPLETE | Active | source.complete | connected | emit all remaining buffers; complete downstream; release owned subscriptions | closed and buffers discarded | S7-BUFFER-SOURCE-COMPLETE |
| BUFFER-SOURCE-ERROR | Active | source.error | connected | forward original source error; release subscriptions without flush | closed with buffered values discarded | S7-BUFFER-SOURCE-ERROR |
| BUFFER-CANCEL | Active | cancel | connected between reactions | release subscriptions with no notification | closed with buffered values discarded | S7-BUFFER-CANCEL |
| BUFFER-NOTIFIER-NEXT | Active | notifier.next | closing notifier still active | emit the current buffer, including empty; start a fresh empty buffer | active with a new empty buffer | S7-BUFFER-NOTIFIER-NEXT |
| BUFFER-NOTIFIER-COMPLETE | Active | notifier.complete | closing notifier still active | release completed notifier but keep collecting source values | active with the same accumulated buffer | S7-BUFFER-NOTIFIER-COMPLETE |
| BUFFER-NOTIFIER-ERROR | Active | notifier.error | closing notifier still active | forward original notifier error; release subscriptions without flush | closed and values discarded | S7-BUFFER-NOTIFIER-ERROR |
