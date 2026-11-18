# takeLast-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session20-rxjs.test.mjs, tests/session20-differential.test.mjs.

## S20-TAKELAST-START

Reach **Unsubscribed** with **first consumer connection and count > 0**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: Collecting with an empty FIFO buffer.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAKELAST-START.

## S20-TAKELAST-APPEND

Reach **Collecting** with **buffer has fewer than count values**, then provide **source.next**.

Expect, in order: append the new value; emit nothing.

Resulting state: FIFO grows by one and retains arrival order.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAKELAST-APPEND.

## S20-TAKELAST-REPLACE-OLDEST

Reach **Collecting** with **buffer has count values**, then provide **source.next**.

Expect, in order: drop oldest buffered reference and append the new value; emit nothing.

Resulting state: FIFO contains exactly the newest count references.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAKELAST-REPLACE-OLDEST.

## S20-TAKELAST-COMPLETE-FLUSH

Reach **Collecting** with **source completes successfully**, then provide **source.complete**.

Expect, in order: emit retained references in FIFO order; complete result; release source.

Resulting state: Closed complete; the retained buffer is discarded after its output word.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAKELAST-COMPLETE-FLUSH.

## S20-TAKELAST-ERROR

Reach **Collecting** with **source fails**, then provide **source.error**.

Expect, in order: forward the exact error; release source without flushing.

Resulting state: Closed error; buffered values are discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAKELAST-ERROR.

## S20-TAKELAST-CANCEL

Reach **Collecting** with **consumer closes the connection**, then provide **cancel**.

Expect, in order: release source without output.

Resulting state: Closed cancel; buffered values are discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-TAKELAST-CANCEL.
