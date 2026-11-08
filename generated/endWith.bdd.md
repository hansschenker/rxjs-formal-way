# endWith-unscheduled-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## ENDWITH-INIT

```text
Given Unsubscribed and new subscription
When begin a fresh execution, acquiring the source only now
Then connect source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ENDWITH-PASS

```text
Given Active and source live
When source delivers an opaque value
Then forward exact source payload
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ENDWITH-SUFFIX-BEGIN

```text
Given Active and source successfully completed
When source completes successfully
Then release source
Then begin synchronous suffix
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ENDWITH-SUFFIX-NEXT

```text
Given Suffix and suffix index < number of values
When synchronous append of next configured suffix value
Then emit next suffix payload
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ENDWITH-SUFFIX-COMPLETE

```text
Given Suffix and all suffix values emitted
When finite suffix sequence finishes
Then complete downstream
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ENDWITH-ERROR

```text
Given Active and source fails
When source fails with its original error object
Then forward exact error
Then release source; suppress suffix
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ENDWITH-CANCEL-ACTIVE

```text
Given Active and cancel during source
When release work silently without completion
Then release source silently
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ENDWITH-CANCEL-SUFFIX

```text
Given Suffix and cancel between suffix emissions
When release work silently without completion
Then stop suffix without completion
And control and memory updated atomically; resource lifetime follows ordered actions
```
