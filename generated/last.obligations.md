# last-predicate-required: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session13-rxjs.test.mjs.

## S13-LAST-INIT

Reach **Unsubscribed** with **fresh subscription**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: updated control and subscription-local memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-LAST-INIT.

## S13-LAST-TAKE

Reach **Active** with **no predicate configured**, then provide **source.next**.

Expect, in order: store last value; no output.

Resulting state: updated control and subscription-local memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-LAST-TAKE.

## S13-LAST-CHECK

Reach **Active** with **predicate configured and source value arrives**, then provide **source.next**.

Expect, in order: invoke indexed predicate.

Resulting state: updated control and subscription-local memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-LAST-CHECK.

## S13-LAST-MATCH

Reach **Calling** with **correlated callback returned truthy**, then provide **callback.return**.

Expect, in order: remember pending value.

Resulting state: updated control and subscription-local memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-LAST-MATCH.

## S13-LAST-REJECT

Reach **Calling** with **correlated callback returned falsy**, then provide **callback.return**.

Expect, in order: keep previous candidate.

Resulting state: updated control and subscription-local memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-LAST-REJECT.

## S13-LAST-PREDICATE-ERROR

Reach **Calling** with **correlated callback throws**, then provide **callback.throw**.

Expect, in order: forward same error; release source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-LAST-PREDICATE-ERROR.

## S13-LAST-EMIT-LAST

Reach **Active** with **candidate exists**, then provide **source.complete**.

Expect, in order: emit last candidate; complete; release source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-LAST-EMIT-LAST.

## S13-LAST-EMIT-DEFAULT

Reach **Active** with **no candidate and default was explicitly supplied**, then provide **source.complete**.

Expect, in order: emit fallback; complete; release source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-LAST-EMIT-DEFAULT.

## S13-LAST-EMPTY-ERROR

Reach **Active** with **no candidate and default absent**, then provide **source.complete**.

Expect, in order: emit EmptyError; release source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-LAST-EMPTY-ERROR.

## S13-LAST-SOURCE-ERROR

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: forward exact error; release source.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-LAST-SOURCE-ERROR.

## S13-LAST-CANCEL

Reach **Active** with **consumer closes**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: terminal with no owned work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S13-LAST-CANCEL.
