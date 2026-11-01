# distinctUntilKeyChanged-property-strict: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Selecting" as s2
    state "Comparing" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : DISTINCTUNTILKEYCHANGED-INIT subscribe [fresh execution]
    s1 --> s2 : DISTINCTUNTILKEYCHANGED-SELECT source.next [source index below safe-integer bound]
    s2 --> s1 : DISTINCTUNTILKEYCHANGED-FIRST key.return [matching key resolution and no prior emitted key]
    s2 --> s3 : DISTINCTUNTILKEYCHANGED-COMPARE key.return [matching key resolution and a prior emitted key]
    s3 --> s1 : DISTINCTUNTILKEYCHANGED-CHANGE compare.return [matching comparison with falsy equality result]
    s3 --> s1 : DISTINCTUNTILKEYCHANGED-SAME compare.return [matching comparison with truthy equality result]
    s2 --> s4 : DISTINCTUNTILKEYCHANGED-SELECT-ERROR key.throw [matching key resolution]
    s3 --> s4 : DISTINCTUNTILKEYCHANGED-COMPARE-ERROR compare.throw [matching comparator outcome]
    s1 --> s4 : DISTINCTUNTILKEYCHANGED-COMPLETE source.complete [no unresolved synchronous key or comparison]
    s1 --> s4 : DISTINCTUNTILKEYCHANGED-ERROR source.error [no unresolved synchronous key or comparison]
    s1 --> s4 : DISTINCTUNTILKEYCHANGED-CANCEL cancel [cancellation between resolved source values]
```
