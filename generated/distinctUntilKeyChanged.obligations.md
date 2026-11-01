# distinctUntilKeyChanged-property-strict: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session4-rxjs.test.mjs.

## DISTINCTUNTILKEYCHANGED-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe to the source; remember no previous emitted key.

Resulting state: active with no previous key and index zero. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCTUNTILKEYCHANGED-INIT.

## DISTINCTUNTILKEYCHANGED-SELECT

Reach **Active** with **source index below safe-integer bound**, then provide **source.next**.

Expect, in order: resolve the incoming key (a synthetic identity/property microstep unless the user supplied a selector).

Resulting state: one key resolution pending; previous emitted key retained. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCTUNTILKEYCHANGED-SELECT.

## DISTINCTUNTILKEYCHANGED-FIRST

Reach **Selecting** with **matching key resolution and no prior emitted key**, then provide **key.return**.

Expect, in order: store the selected key before forwarding the original value.

Resulting state: active remembering the first emitted key. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCTUNTILKEYCHANGED-FIRST.

## DISTINCTUNTILKEYCHANGED-COMPARE

Reach **Selecting** with **matching key resolution and a prior emitted key**, then provide **key.return**.

Expect, in order: compare previous emitted key with incoming key.

Resulting state: one comparison outcome pending. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCTUNTILKEYCHANGED-COMPARE.

## DISTINCTUNTILKEYCHANGED-CHANGE

Reach **Comparing** with **matching comparison with falsy equality result**, then provide **compare.return**.

Expect, in order: replace the stored key before forwarding the original value.

Resulting state: active with new previous emitted key. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCTUNTILKEYCHANGED-CHANGE.

## DISTINCTUNTILKEYCHANGED-SAME

Reach **Comparing** with **matching comparison with truthy equality result**, then provide **compare.return**.

Expect, in order: no actions.

Resulting state: active keeping the previous FORWARDED key. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCTUNTILKEYCHANGED-SAME.

## DISTINCTUNTILKEYCHANGED-SELECT-ERROR

Reach **Selecting** with **matching key resolution**, then provide **key.throw**.

Expect, in order: forward selector error unchanged; release source.

Resulting state: closed on key-selection failure. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCTUNTILKEYCHANGED-THROW.

## DISTINCTUNTILKEYCHANGED-COMPARE-ERROR

Reach **Comparing** with **matching comparator outcome**, then provide **compare.throw**.

Expect, in order: forward comparator error unchanged; release source.

Resulting state: closed on comparison failure. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCTUNTILKEYCHANGED-THROW.

## DISTINCTUNTILKEYCHANGED-COMPLETE

Reach **Active** with **no unresolved synchronous key or comparison**, then provide **source.complete**.

Expect, in order: complete downstream; release source.

Resulting state: closed after source completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCTUNTILKEYCHANGED-LIFECYCLE.

## DISTINCTUNTILKEYCHANGED-ERROR

Reach **Active** with **no unresolved synchronous key or comparison**, then provide **source.error**.

Expect, in order: forward source error unchanged; release source.

Resulting state: closed after source error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCTUNTILKEYCHANGED-LIFECYCLE.

## DISTINCTUNTILKEYCHANGED-CANCEL

Reach **Active** with **cancellation between resolved source values**, then provide **cancel**.

Expect, in order: release source without downstream terminal.

Resulting state: closed by cancellation. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S4-DISTINCTUNTILKEYCHANGED-LIFECYCLE.
