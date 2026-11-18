# takeLast-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S20-TAKELAST-START | Unsubscribed | subscribe | first consumer connection and count > 0 | subscribe source | Collecting with an empty FIFO buffer. | S20-TAKELAST-START |
| S20-TAKELAST-APPEND | Collecting | source.next | buffer has fewer than count values | append the new value; emit nothing | FIFO grows by one and retains arrival order. | S20-TAKELAST-APPEND |
| S20-TAKELAST-REPLACE-OLDEST | Collecting | source.next | buffer has count values | drop oldest buffered reference and append the new value; emit nothing | FIFO contains exactly the newest count references. | S20-TAKELAST-REPLACE-OLDEST |
| S20-TAKELAST-COMPLETE-FLUSH | Collecting | source.complete | source completes successfully | emit retained references in FIFO order; complete result; release source | Closed complete; the retained buffer is discarded after its output word. | S20-TAKELAST-COMPLETE-FLUSH |
| S20-TAKELAST-ERROR | Collecting | source.error | source fails | forward the exact error; release source without flushing | Closed error; buffered values are discarded. | S20-TAKELAST-ERROR |
| S20-TAKELAST-CANCEL | Collecting | cancel | consumer closes the connection | release source without output | Closed cancel; buffered values are discarded. | S20-TAKELAST-CANCEL |
