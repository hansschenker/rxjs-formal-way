# throwIfEmpty-custom: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session20-rxjs.test.mjs, tests/session20-differential.test.mjs.

## S20-THROWIFEMPTY-START

Reach **Unsubscribed** with **first consumer connection**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: Listening with hasValue=false.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROWIFEMPTY-START.

## S20-THROWIFEMPTY-NEXT

Reach **Listening** with **source subscription is live**, then provide **source.next**.

Expect, in order: forward exact source value.

Resulting state: Listening with hasValue=true, including when the value is undefined.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROWIFEMPTY-NEXT.

## S20-THROWIFEMPTY-COMPLETE-NONEMPTY

Reach **Listening** with **at least one value has arrived**, then provide **source.complete**.

Expect, in order: complete result; release source.

Resulting state: Closed complete; never invoke the factory.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROWIFEMPTY-COMPLETE-NONEMPTY.

## S20-THROWIFEMPTY-COMPLETE-EMPTY

Reach **Listening** with **no value has arrived**, then provide **source.complete**.

Expect, in order: invoke the selected error factory once.

Resulting state: CreatingError; waiting only for its correlated synchronous outcome.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROWIFEMPTY-COMPLETE-EMPTY.

## S20-THROWIFEMPTY-FACTORY-RETURN

Reach **CreatingError** with **outcome belongs to errorFactory invocation zero**, then provide **callback.return**.

Expect, in order: error with the exact returned value; release source.

Resulting state: Closed error; no completion notification.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROWIFEMPTY-FACTORY-RETURN.

## S20-THROWIFEMPTY-FACTORY-THROW

Reach **CreatingError** with **outcome belongs to errorFactory invocation zero**, then provide **callback.throw**.

Expect, in order: forward the exact thrown value as error; release source.

Resulting state: Closed error; no completion notification.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROWIFEMPTY-FACTORY-THROW.

## S20-THROWIFEMPTY-SOURCE-ERROR

Reach **Listening** with **source fails, regardless of value presence**, then provide **source.error**.

Expect, in order: forward exact source error; release source.

Resulting state: Closed error; factory never invoked.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROWIFEMPTY-SOURCE-ERROR.

## S20-THROWIFEMPTY-CANCEL

Reach **Listening** with **consumer cancels before source termination**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: Closed cancel; factory never invoked.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S20-THROWIFEMPTY-CANCEL.
