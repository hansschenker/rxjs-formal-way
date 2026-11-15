# sampleTime-source-first-3: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session18-rxjs.test.mjs.

## S18-SAMPLETIME-START

Reach **Unsubscribed** with **first result subscription**, then provide **subscribe**.

Expect, in order: subscribe source; schedule first virtual tick.

Resulting state: Listening with no remembered value and one sampling mechanism.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLETIME-START.

## S18-SAMPLETIME-REMEMBER

Reach **Listening** with **live source emission (any payload)**, then provide **source.next**.

Expect, in order: replace remembered value with exact payload; no downstream notification.

Resulting state: hasValue=true; lastValue replaced.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLETIME-REMEMBER.

## S18-SAMPLETIME-TICK-EMIT

Reach **Listening** with **current scheduled tick reaches due time; hasValue=true**, then provide **timer.fire**.

Expect, in order: emit latest unsampled value; schedule following tick.

Resulting state: No pending value and next periodic tick advances.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLETIME-TICK-EMIT.

## S18-SAMPLETIME-TICK-EMPTY

Reach **Listening** with **current scheduled tick reaches due time; hasValue=false**, then provide **timer.fire**.

Expect, in order: schedule following tick without output.

Resulting state: No pending value and next periodic tick advances.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLETIME-TICK-EMPTY.

## S18-SAMPLETIME-COMPLETE

Reach **Listening** with **source completes**, then provide **source.complete**.

Expect, in order: complete immediately, without flushing pending value; release source and sampling mechanism.

Resulting state: Closed complete.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLETIME-COMPLETE.

## S18-SAMPLETIME-ERROR

Reach **Listening** with **source fails**, then provide **source.error**.

Expect, in order: forward exact error immediately; release source and sampling mechanism.

Resulting state: Closed error.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLETIME-ERROR.

## S18-SAMPLETIME-CANCEL

Reach **Listening** with **consumer cancels**, then provide **cancel**.

Expect, in order: release subscriptions or timer; never notify.

Resulting state: Closed cancel.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S18-SAMPLETIME-CANCEL.
