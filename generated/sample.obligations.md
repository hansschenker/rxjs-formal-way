# sample-source-first-notifier: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session18-rxjs.test.mjs.

## S18-SAMPLE-START

Reach **Unsubscribed** with **first result subscription**, then provide **subscribe**.

Expect, in order: subscribe source before notifier.

Resulting state: Listening with no remembered value and one sampling mechanism.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLE-START.

## S18-SAMPLE-REMEMBER

Reach **Listening** with **live source emission (any payload)**, then provide **source.next**.

Expect, in order: replace remembered value with exact payload; no downstream notification.

Resulting state: hasValue=true; lastValue replaced.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLE-REMEMBER.

## S18-SAMPLE-NOTIFIER-EMIT

Reach **Listening** with **notifier next with pending value**, then provide **notifier.next**.

Expect, in order: emit latest value once and clear presence.

Resulting state: Clear remembered presence on every sample.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLE-NOTIFIER-EMIT.

## S18-SAMPLE-NOTIFIER-EMPTY

Reach **Listening** with **notifier next with no value since last sample**, then provide **notifier.next**.

Expect, in order: do not emit.

Resulting state: Clear remembered presence on every sample.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLE-NOTIFIER-EMPTY.

## S18-SAMPLE-NOTIFIER-COMPLETE

Reach **Listening** with **notifier is open; completion is not a sampling notification**, then provide **notifier.complete**.

Expect, in order: release notifier; do not flush latest value or terminate source.

Resulting state: Source continues with notifier completed and unsampled memory retained.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLE-NOTIFIER-COMPLETE.

## S18-SAMPLE-NOTIFIER-ERROR

Reach **Listening** with **notifier is open**, then provide **notifier.error**.

Expect, in order: forward exact error; teardown source and notifier.

Resulting state: Closed on error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLE-NOTIFIER-ERROR.

## S18-SAMPLE-COMPLETE

Reach **Listening** with **source completes**, then provide **source.complete**.

Expect, in order: complete immediately, without flushing pending value; release source and sampling mechanism.

Resulting state: Closed complete.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLE-COMPLETE.

## S18-SAMPLE-ERROR

Reach **Listening** with **source fails**, then provide **source.error**.

Expect, in order: forward exact error immediately; release source and sampling mechanism.

Resulting state: Closed error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLE-ERROR.

## S18-SAMPLE-CANCEL

Reach **Listening** with **consumer cancels**, then provide **cancel**.

Expect, in order: release subscriptions or timer; never notify.

Resulting state: Closed cancel.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLE-CANCEL.
