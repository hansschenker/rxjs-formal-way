# distinctUntilKeyChanged-property-strict: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| DISTINCTUNTILKEYCHANGED-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the source; remember no previous emitted key | active with no previous key and index zero | S4-DISTINCTUNTILKEYCHANGED-INIT |
| DISTINCTUNTILKEYCHANGED-SELECT | Active | source.next | source index below safe-integer bound | resolve the incoming key (a synthetic identity/property microstep unless the user supplied a selector) | one key resolution pending; previous emitted key retained | S4-DISTINCTUNTILKEYCHANGED-SELECT |
| DISTINCTUNTILKEYCHANGED-FIRST | Selecting | key.return | matching key resolution and no prior emitted key | store the selected key before forwarding the original value | active remembering the first emitted key | S4-DISTINCTUNTILKEYCHANGED-FIRST |
| DISTINCTUNTILKEYCHANGED-COMPARE | Selecting | key.return | matching key resolution and a prior emitted key | compare previous emitted key with incoming key | one comparison outcome pending | S4-DISTINCTUNTILKEYCHANGED-COMPARE |
| DISTINCTUNTILKEYCHANGED-CHANGE | Comparing | compare.return | matching comparison with falsy equality result | replace the stored key before forwarding the original value | active with new previous emitted key | S4-DISTINCTUNTILKEYCHANGED-CHANGE |
| DISTINCTUNTILKEYCHANGED-SAME | Comparing | compare.return | matching comparison with truthy equality result | no actions | active keeping the previous FORWARDED key | S4-DISTINCTUNTILKEYCHANGED-SAME |
| DISTINCTUNTILKEYCHANGED-SELECT-ERROR | Selecting | key.throw | matching key resolution | forward selector error unchanged; release source | closed on key-selection failure | S4-DISTINCTUNTILKEYCHANGED-THROW |
| DISTINCTUNTILKEYCHANGED-COMPARE-ERROR | Comparing | compare.throw | matching comparator outcome | forward comparator error unchanged; release source | closed on comparison failure | S4-DISTINCTUNTILKEYCHANGED-THROW |
| DISTINCTUNTILKEYCHANGED-COMPLETE | Active | source.complete | no unresolved synchronous key or comparison | complete downstream; release source | closed after source completion | S4-DISTINCTUNTILKEYCHANGED-LIFECYCLE |
| DISTINCTUNTILKEYCHANGED-ERROR | Active | source.error | no unresolved synchronous key or comparison | forward source error unchanged; release source | closed after source error | S4-DISTINCTUNTILKEYCHANGED-LIFECYCLE |
| DISTINCTUNTILKEYCHANGED-CANCEL | Active | cancel | cancellation between resolved source values | release source without downstream terminal | closed by cancellation | S4-DISTINCTUNTILKEYCHANGED-LIFECYCLE |
