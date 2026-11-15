# sequenceEqual-strict-FIFO-32: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session18-rxjs.test.mjs.

## S18-SEQUENCEEQUAL-START

Reach **Unsubscribed** with **first downstream subscription**, then provide **subscribe**.

Expect, in order: subscribe source first; subscribe compareTo second.

Resulting state: Comparing with empty queues and two live source subscriptions.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-START.

## S18-SEQUENCEEQUAL-LEFT-QUEUE

Reach **Comparing** with **current side live, opposite FIFO empty and incomplete; buffer below cap**, then provide **left.next**.

Expect, in order: append exact payload to unmatched FIFO.

Resulting state: Append one unmatched payload to current side FIFO.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-LEFT-QUEUE.

## S18-SEQUENCEEQUAL-LEFT-EXTRA

Reach **Comparing** with **opposite stream already completed and has no unmatched value**, then provide **left.next**.

Expect, in order: emit false, complete and release remaining subscriptions.

Resulting state: Closed unequal immediately.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-LEFT-EXTRA.

## S18-SEQUENCEEQUAL-LEFT-MATCH

Reach **Comparing** with **opposite FIFO nonempty and strict equality holds against its oldest value**, then provide **left.next**.

Expect, in order: discard one oldest opposite FIFO entry; no output.

Resulting state: Opposite FIFO shrinks by one while both completion flags remain unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-LEFT-MATCH.

## S18-SEQUENCEEQUAL-LEFT-DIFFER

Reach **Comparing** with **opposite FIFO nonempty and strict equality fails**, then provide **left.next**.

Expect, in order: emit false then complete; release all live sources.

Resulting state: Closed unequal immediately.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-LEFT-DIFFER.

## S18-SEQUENCEEQUAL-LEFT-FIRST-COMPLETE

Reach **Comparing** with **current side is live and the other side is not yet completed**, then provide **left.complete**.

Expect, in order: release completed source subscription; retain unmatched FIFO.

Resulting state: Mark side completed and await the other stream.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-LEFT-FIRST-COMPLETE.

## S18-SEQUENCEEQUAL-LEFT-FINAL-EQUAL

Reach **Comparing** with **opposite stream already completed; unmatched buffers both empty**, then provide **left.complete**.

Expect, in order: emit true and complete; release final subscription.

Resulting state: Closed equal.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-LEFT-FINAL-EQUAL.

## S18-SEQUENCEEQUAL-LEFT-FINAL-UNEVEN

Reach **Comparing** with **opposite stream already completed; unmatched buffers not empty**, then provide **left.complete**.

Expect, in order: emit false and complete; release final subscription.

Resulting state: Closed unequal.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-LEFT-FINAL-UNEVEN.

## S18-SEQUENCEEQUAL-LEFT-ERROR

Reach **Comparing** with **current side is live**, then provide **left.error**.

Expect, in order: forward exact error identity; release all live subscriptions.

Resulting state: Closed error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-LEFT-ERROR.

## S18-SEQUENCEEQUAL-RIGHT-QUEUE

Reach **Comparing** with **current side live, opposite FIFO empty and incomplete; buffer below cap**, then provide **right.next**.

Expect, in order: append exact payload to unmatched FIFO.

Resulting state: Append one unmatched payload to current side FIFO.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-RIGHT-QUEUE.

## S18-SEQUENCEEQUAL-RIGHT-EXTRA

Reach **Comparing** with **opposite stream already completed and has no unmatched value**, then provide **right.next**.

Expect, in order: emit false, complete and release remaining subscriptions.

Resulting state: Closed unequal immediately.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-RIGHT-EXTRA.

## S18-SEQUENCEEQUAL-RIGHT-MATCH

Reach **Comparing** with **opposite FIFO nonempty and strict equality holds against its oldest value**, then provide **right.next**.

Expect, in order: discard one oldest opposite FIFO entry; no output.

Resulting state: Opposite FIFO shrinks by one while both completion flags remain unchanged.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-RIGHT-MATCH.

## S18-SEQUENCEEQUAL-RIGHT-DIFFER

Reach **Comparing** with **opposite FIFO nonempty and strict equality fails**, then provide **right.next**.

Expect, in order: emit false then complete; release all live sources.

Resulting state: Closed unequal immediately.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-RIGHT-DIFFER.

## S18-SEQUENCEEQUAL-RIGHT-FIRST-COMPLETE

Reach **Comparing** with **current side is live and the other side is not yet completed**, then provide **right.complete**.

Expect, in order: release completed source subscription; retain unmatched FIFO.

Resulting state: Mark side completed and await the other stream.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-RIGHT-FIRST-COMPLETE.

## S18-SEQUENCEEQUAL-RIGHT-FINAL-EQUAL

Reach **Comparing** with **opposite stream already completed; unmatched buffers both empty**, then provide **right.complete**.

Expect, in order: emit true and complete; release final subscription.

Resulting state: Closed equal.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-RIGHT-FINAL-EQUAL.

## S18-SEQUENCEEQUAL-RIGHT-FINAL-UNEVEN

Reach **Comparing** with **opposite stream already completed; unmatched buffers not empty**, then provide **right.complete**.

Expect, in order: emit false and complete; release final subscription.

Resulting state: Closed unequal.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-RIGHT-FINAL-UNEVEN.

## S18-SEQUENCEEQUAL-RIGHT-ERROR

Reach **Comparing** with **current side is live**, then provide **right.error**.

Expect, in order: forward exact error identity; release all live subscriptions.

Resulting state: Closed error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-RIGHT-ERROR.

## S18-SEQUENCEEQUAL-CANCEL

Reach **Comparing** with **consumer cancels**, then provide **cancel**.

Expect, in order: release each still-live source without a boolean or completion.

Resulting state: Closed cancel.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SEQUENCEEQUAL-CANCEL.
