# onErrorResumeNext-pipeable-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session15-rxjs.test.mjs.

## S15-ONERRORRESUMENEXT-INIT

Reach **Unsubscribed** with **first subscription**, then provide **subscribe**.

Expect, in order: connect piped source index 0.

Resulting state: one current subscription; others waiting. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-ONERRORRESUMENEXT-INIT.

## S15-ONERRORRESUMENEXT-NEXT

Reach **Active** with **matching current source**, then provide **input.next**.

Expect, in order: forward opaque input value.

Resulting state: one current subscription; others waiting. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-ONERRORRESUMENEXT-NEXT.

## S15-ONERRORRESUMENEXT-COMPLETE-ADVANCE

Reach **Active** with **current input terminal and one later input remains**, then provide **input.complete**.

Expect, in order: release current; subscribe next input.

Resulting state: one current subscription; others waiting. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-ONERRORRESUMENEXT-COMPLETE-ADVANCE.

## S15-ONERRORRESUMENEXT-COMPLETE-LAST

Reach **Active** with **final current input terminates**, then provide **input.complete**.

Expect, in order: release final input; complete result without propagating error.

Resulting state: all source subscriptions released. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-ONERRORRESUMENEXT-COMPLETE-LAST.

## S15-ONERRORRESUMENEXT-ERROR-ADVANCE

Reach **Active** with **current input terminal and one later input remains**, then provide **input.error**.

Expect, in order: release current; subscribe next input.

Resulting state: one current subscription; others waiting. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-ONERRORRESUMENEXT-ERROR-ADVANCE.

## S15-ONERRORRESUMENEXT-ERROR-LAST

Reach **Active** with **final current input terminates**, then provide **input.error**.

Expect, in order: release final input; complete result without propagating error.

Resulting state: all source subscriptions released. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-ONERRORRESUMENEXT-ERROR-LAST.

## S15-ONERRORRESUMENEXT-CANCEL

Reach **Active** with **downstream cancellation**, then provide **cancel**.

Expect, in order: unsubscribe current; no output terminal.

Resulting state: all source subscriptions released. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S15-ONERRORRESUMENEXT-CANCEL.
