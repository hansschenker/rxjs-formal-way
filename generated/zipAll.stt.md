# zipAll-deferred-fifo-8-8: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S23-ZIPALL-START | Unsubscribed | subscribe | fresh execution | acquire outer only | Empty ordered source collection. | S23-ZIPALL-START |
| S23-ZIPALL-COLLECT | Collecting | outer.next | collected count is below maxInners | retain the opaque inner description; do not connect it | Append one source occurrence in outer arrival order. | S23-ZIPALL-COLLECT |
| S23-ZIPALL-OUTER-EMPTY | Collecting | outer.complete | no collected source occurrences | complete downstream without an empty tuple; release outer | Closed complete; discard collection. | S23-ZIPALL-OUTER-EMPTY |
| S23-ZIPALL-OUTER-JOIN | Collecting | outer.complete | at least one collected source occurrence | acquire all inners in collection order; release outer after inner acquisition | One empty FIFO and live connection for each occurrence; emitted count zero. | S23-ZIPALL-OUTER-JOIN |
| S23-ZIPALL-OUTER-ERROR | Collecting | outer.error | outer is live | error downstream with the same payload; release outer without connecting inners | Closed outer-error; discard descriptions. | S23-ZIPALL-OUTER-ERROR |
| S23-ZIPALL-CANCEL-COLLECT | Collecting | cancel | outer connection is active | release outer silently | Closed cancel; discard descriptions. | S23-ZIPALL-CANCEL-COLLECT |
| S23-ZIPALL-INNER-BUFFER | Joining | inner.next | live addressed inner, room in bounded scope, another FIFO empty | append value to addressed FIFO; emit nothing | Increase that occurrence's received count; retain all other queues. | S23-ZIPALL-INNER-BUFFER |
| S23-ZIPALL-INNER-EMIT | Joining | inner.next | live addressed inner, all FIFOs ready after append, no completed FIFO exhausted | append value; remove the oldest value from every FIFO; emit one fresh tuple in collection order | Increment emitted count and retain each unconsumed FIFO suffix. | S23-ZIPALL-INNER-EMIT |
| S23-ZIPALL-INNER-DRAIN | Joining | inner.next | all FIFOs ready after append; a completed FIFO has its final value | emit the last pairable tuple; release still-live inners in collection order; complete downstream after releases | Closed complete; no unmatched suffix retained. | S23-ZIPALL-INNER-DRAIN |
| S23-ZIPALL-INNER-COMPLETE-BUFFERED | Joining | inner.complete | live addressed inner has queued values | release only the completed inner producer | Mark slot no longer live, retaining its FIFO suffix. | S23-ZIPALL-INNER-COMPLETE-BUFFERED |
| S23-ZIPALL-INNER-COMPLETE-EMPTY | Joining | inner.complete | live addressed inner has no queued values | release all still-live inners in collection order; complete downstream after releases | Closed complete; discard unmatched suffixes. | S23-ZIPALL-INNER-COMPLETE-EMPTY |
| S23-ZIPALL-INNER-ERROR | Joining | inner.error | addressed inner is still live | error downstream with original payload; release all live inner producers in collection order | Closed inner-error; discard all FIFO values. | S23-ZIPALL-INNER-ERROR |
| S23-ZIPALL-CANCEL-JOIN | Joining | cancel | join owns live inputs | release live inners in collection order without notification | Closed cancel; discard queues. | S23-ZIPALL-CANCEL-JOIN |
