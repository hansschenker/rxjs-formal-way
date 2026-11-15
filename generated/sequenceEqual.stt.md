# sequenceEqual-strict-FIFO-32: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S18-SEQUENCEEQUAL-START | Unsubscribed | subscribe | first downstream subscription | subscribe source first; subscribe compareTo second | Comparing with empty queues and two live source subscriptions. | S18-SEQUENCEEQUAL-START |
| S18-SEQUENCEEQUAL-LEFT-QUEUE | Comparing | left.next | current side live, opposite FIFO empty and incomplete; buffer below cap | append exact payload to unmatched FIFO | Append one unmatched payload to current side FIFO. | S18-SEQUENCEEQUAL-LEFT-QUEUE |
| S18-SEQUENCEEQUAL-LEFT-EXTRA | Comparing | left.next | opposite stream already completed and has no unmatched value | emit false, complete and release remaining subscriptions | Closed unequal immediately. | S18-SEQUENCEEQUAL-LEFT-EXTRA |
| S18-SEQUENCEEQUAL-LEFT-MATCH | Comparing | left.next | opposite FIFO nonempty and strict equality holds against its oldest value | discard one oldest opposite FIFO entry; no output | Opposite FIFO shrinks by one while both completion flags remain unchanged. | S18-SEQUENCEEQUAL-LEFT-MATCH |
| S18-SEQUENCEEQUAL-LEFT-DIFFER | Comparing | left.next | opposite FIFO nonempty and strict equality fails | emit false then complete; release all live sources | Closed unequal immediately. | S18-SEQUENCEEQUAL-LEFT-DIFFER |
| S18-SEQUENCEEQUAL-LEFT-FIRST-COMPLETE | Comparing | left.complete | current side is live and the other side is not yet completed | release completed source subscription; retain unmatched FIFO | Mark side completed and await the other stream. | S18-SEQUENCEEQUAL-LEFT-FIRST-COMPLETE |
| S18-SEQUENCEEQUAL-LEFT-FINAL-EQUAL | Comparing | left.complete | opposite stream already completed; unmatched buffers both empty | emit true and complete; release final subscription | Closed equal. | S18-SEQUENCEEQUAL-LEFT-FINAL-EQUAL |
| S18-SEQUENCEEQUAL-LEFT-FINAL-UNEVEN | Comparing | left.complete | opposite stream already completed; unmatched buffers not empty | emit false and complete; release final subscription | Closed unequal. | S18-SEQUENCEEQUAL-LEFT-FINAL-UNEVEN |
| S18-SEQUENCEEQUAL-LEFT-ERROR | Comparing | left.error | current side is live | forward exact error identity; release all live subscriptions | Closed error. | S18-SEQUENCEEQUAL-LEFT-ERROR |
| S18-SEQUENCEEQUAL-RIGHT-QUEUE | Comparing | right.next | current side live, opposite FIFO empty and incomplete; buffer below cap | append exact payload to unmatched FIFO | Append one unmatched payload to current side FIFO. | S18-SEQUENCEEQUAL-RIGHT-QUEUE |
| S18-SEQUENCEEQUAL-RIGHT-EXTRA | Comparing | right.next | opposite stream already completed and has no unmatched value | emit false, complete and release remaining subscriptions | Closed unequal immediately. | S18-SEQUENCEEQUAL-RIGHT-EXTRA |
| S18-SEQUENCEEQUAL-RIGHT-MATCH | Comparing | right.next | opposite FIFO nonempty and strict equality holds against its oldest value | discard one oldest opposite FIFO entry; no output | Opposite FIFO shrinks by one while both completion flags remain unchanged. | S18-SEQUENCEEQUAL-RIGHT-MATCH |
| S18-SEQUENCEEQUAL-RIGHT-DIFFER | Comparing | right.next | opposite FIFO nonempty and strict equality fails | emit false then complete; release all live sources | Closed unequal immediately. | S18-SEQUENCEEQUAL-RIGHT-DIFFER |
| S18-SEQUENCEEQUAL-RIGHT-FIRST-COMPLETE | Comparing | right.complete | current side is live and the other side is not yet completed | release completed source subscription; retain unmatched FIFO | Mark side completed and await the other stream. | S18-SEQUENCEEQUAL-RIGHT-FIRST-COMPLETE |
| S18-SEQUENCEEQUAL-RIGHT-FINAL-EQUAL | Comparing | right.complete | opposite stream already completed; unmatched buffers both empty | emit true and complete; release final subscription | Closed equal. | S18-SEQUENCEEQUAL-RIGHT-FINAL-EQUAL |
| S18-SEQUENCEEQUAL-RIGHT-FINAL-UNEVEN | Comparing | right.complete | opposite stream already completed; unmatched buffers not empty | emit false and complete; release final subscription | Closed unequal. | S18-SEQUENCEEQUAL-RIGHT-FINAL-UNEVEN |
| S18-SEQUENCEEQUAL-RIGHT-ERROR | Comparing | right.error | current side is live | forward exact error identity; release all live subscriptions | Closed error. | S18-SEQUENCEEQUAL-RIGHT-ERROR |
| S18-SEQUENCEEQUAL-CANCEL | Comparing | cancel | consumer cancels | release each still-live source without a boolean or completion | Closed cancel. | S18-SEQUENCEEQUAL-CANCEL |
