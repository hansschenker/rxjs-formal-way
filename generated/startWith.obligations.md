# startWith-unscheduled-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session4-rxjs.test.mjs.

## STARTWITH-INIT-EMPTY

Reach **Unsubscribed** with **zero supplied values**, then provide **subscribe**.

Expect, in order: subscribe source immediately.

Resulting state: active with source subscription. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-STARTWITH-EMPTY.

## STARTWITH-INIT-PREFIX

Reach **Unsubscribed** with **one or more prefix values**, then provide **subscribe**.

Expect, in order: begin synchronous prefix delivery without subscribing to source.

Resulting state: prefix phase with index zero. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-STARTWITH-PREFIX.

## STARTWITH-EMIT

Reach **Prefix** with **prefix index < configured length**, then provide **prefix.next**.

Expect, in order: emit the current prefix payload synchronously.

Resulting state: prefix phase with advanced index. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-STARTWITH-PREFIX.

## STARTWITH-CONNECT

Reach **Prefix** with **every prefix value emitted**, then provide **prefix.complete**.

Expect, in order: subscribe source after the last prefix notification returns.

Resulting state: active; source now subscribed. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-STARTWITH-ORDER.

## STARTWITH-CANCEL-PREFIX

Reach **Prefix** with **cancel before source acquisition**, then provide **cancel**.

Expect, in order: stop prefix delivery; no source subscription to release.

Resulting state: closed before subscribing to source. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-STARTWITH-CANCEL.

## STARTWITH-NEXT

Reach **Active** with **source connected**, then provide **source.next**.

Expect, in order: forward source value unchanged.

Resulting state: active. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-STARTWITH-ORDER.

## STARTWITH-COMPLETE

Reach **Active** with **source completed after prefix**, then provide **source.complete**.

Expect, in order: complete downstream; release source.

Resulting state: closed after completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-STARTWITH-LIFECYCLE.

## STARTWITH-ERROR

Reach **Active** with **source errored after prefix**, then provide **source.error**.

Expect, in order: forward exact error; release source.

Resulting state: closed after error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-STARTWITH-LIFECYCLE.

## STARTWITH-CANCEL-ACTIVE

Reach **Active** with **source already subscribed**, then provide **cancel**.

Expect, in order: release source without completion.

Resulting state: closed by cancellation. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-STARTWITH-CANCEL.
