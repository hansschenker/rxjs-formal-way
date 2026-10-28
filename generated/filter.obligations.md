# filter-predicate: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/m02-rxjs.test.mjs.

## FILTER-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe to the source without invoking the callback.

Resulting state: active with callback index zero. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02-FILTER-01.

## FILTER-CALL

Reach **Active** with **index < Number.MAX_SAFE_INTEGER**, then provide **source.next**.

Expect, in order: request exactly one callback invocation with the incoming value and the current zero-based index.

Resulting state: calling with the input retained and the next index increased by one. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02-FILTER-02.

## FILTER-PASS

Reach **Calling** with **matching invocation and truthy result**, then provide **callback.return**.

Expect, in order: forward the original incoming value unchanged.

Resulting state: active with the next callback index. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02-FILTER-03.

## FILTER-DROP

Reach **Calling** with **matching invocation and falsy result**, then provide **callback.return**.

Expect, in order: no actions.

Resulting state: active with the next callback index. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02-FILTER-03, M02-FILTER-02.

## FILTER-THROW

Reach **Calling** with **outcome identifies the pending invocation**, then provide **callback.throw**.

Expect, in order: forward the thrown error unchanged; release the source subscription.

Resulting state: closed because the callback threw. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02-FILTER-04.

## FILTER-COMPLETE

Reach **Active** with **no unresolved callback**, then provide **source.complete**.

Expect, in order: complete downstream; release the source subscription.

Resulting state: closed because the source completed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02-FILTER-05.

## FILTER-ERROR

Reach **Active** with **no unresolved callback**, then provide **source.error**.

Expect, in order: forward the source error unchanged; release the source subscription.

Resulting state: closed because the source errored. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02-FILTER-06.

## FILTER-CANCEL

Reach **Active** with **between resolved value reactions**, then provide **cancel**.

Expect, in order: release the source subscription without notifying downstream.

Resulting state: closed because downstream cancelled. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: M02-FILTER-07.
