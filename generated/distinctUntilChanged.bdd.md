# distinctUntilChanged-identity-strict: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## DISTINCTUNTILCHANGED-INIT

```text
Given Unsubscribed and fresh execution
When downstream starts a fresh execution
Then subscribe to the source; remember no previous emitted key
And active with no previous key and index zero
```

## DISTINCTUNTILCHANGED-SELECT

```text
Given Active and source index below safe-integer bound
When a new source payload arrives
Then resolve the incoming key (a synthetic identity/property microstep unless the user supplied a selector)
And one key resolution pending; previous emitted key retained
```

## DISTINCTUNTILCHANGED-FIRST

```text
Given Selecting and matching key resolution and no prior emitted key
When the selected key is available for this source value
Then store the selected key before forwarding the original value
And active remembering the first emitted key
```

## DISTINCTUNTILCHANGED-COMPARE

```text
Given Selecting and matching key resolution and a prior emitted key
When the selected key is available for this source value
Then compare previous emitted key with incoming key
And one comparison outcome pending
```

## DISTINCTUNTILCHANGED-CHANGE

```text
Given Comparing and matching comparison with falsy equality result
When the equality test returns a truthy or falsy result
Then replace the stored key before forwarding the original value
And active with new previous emitted key
```

## DISTINCTUNTILCHANGED-SAME

```text
Given Comparing and matching comparison with truthy equality result
When the equality test returns a truthy or falsy result
Then emit no action
And active keeping the previous FORWARDED key
```

## DISTINCTUNTILCHANGED-SELECT-ERROR

```text
Given Selecting and matching key resolution
When key selection throws
Then forward selector error unchanged
Then release source
And closed on key-selection failure
```

## DISTINCTUNTILCHANGED-COMPARE-ERROR

```text
Given Comparing and matching comparator outcome
When comparison throws
Then forward comparator error unchanged
Then release source
And closed on comparison failure
```

## DISTINCTUNTILCHANGED-COMPLETE

```text
Given Active and no unresolved synchronous key or comparison
When source completes
Then complete downstream
Then release source
And closed after source completion
```

## DISTINCTUNTILCHANGED-ERROR

```text
Given Active and no unresolved synchronous key or comparison
When source fails
Then forward source error unchanged
Then release source
And closed after source error
```

## DISTINCTUNTILCHANGED-CANCEL

```text
Given Active and cancellation between resolved source values
When downstream cancels
Then release source without downstream terminal
And closed by cancellation
```
