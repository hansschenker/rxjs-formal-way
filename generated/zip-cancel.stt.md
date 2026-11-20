# zip-3-fifo-8: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S23-ZIP-START | Unsubscribed | subscribe | no connection yet | acquire source input zero, then each auxiliary in argument order | Every FIFO is empty, every input is live, and received/emitted counts are zero. | S23-ZIP-START |
| S23-ZIP-BUFFER | Active | input.next | addressed input live; within FIFO/count scope; another FIFO remains empty | append the opaque value to its input FIFO; emit nothing | Only that FIFO and its received count change. | S23-ZIP-BUFFER |
| S23-ZIP-EMIT | Active | input.next | addressed input live; every FIFO becomes nonempty; no completed FIFO is exhausted | append input value; remove one oldest value from every FIFO; emit one fresh tuple in input order | Received count advances for arriving input; emitted count advances once; unmatched values remain queued. | S23-ZIP-EMIT |
| S23-ZIP-EMIT-LAST | Active | input.next | addressed input live; tuple ready; removing it exhausts a previously completed FIFO | emit one final tuple in input order; complete downstream; release remaining live inputs in subscription order | Closed and all queued values released. | S23-ZIP-EMIT-LAST |
| S23-ZIP-COMPLETE-BUFFERED | Active | input.complete | addressed input live and its FIFO is nonempty | release this completed input connection only | Input becomes non-live; its FIFO remains available for later tuples. | S23-ZIP-COMPLETE-BUFFERED |
| S23-ZIP-COMPLETE-EMPTY | Active | input.complete | addressed input live and its FIFO is empty | complete downstream; release all remaining live inputs in subscription order | Closed; unmatched values in other FIFOs are discarded. | S23-ZIP-COMPLETE-EMPTY |
| S23-ZIP-ERROR | Active | input.error | addressed input live | error downstream with the same opaque payload; release every remaining live input in subscription order | Closed; queued values are discarded without a final tuple. | S23-ZIP-ERROR |
| S23-ZIP-CANCEL | Active | cancel | result connection remains active | release remaining live input connections without a notification | Closed; queued values are released. | S23-ZIP-CANCEL |
