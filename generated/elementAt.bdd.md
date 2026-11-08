# elementAt-2-default: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## ELEMENTAT-INIT

```text
Given Unsubscribed and valid index
When begin a fresh execution, acquiring the source only now
Then subscribe source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ELEMENTAT-SKIP

```text
Given Active and current index differs from requested index
When source delivers an opaque value
Then advance index without emission
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ELEMENTAT-HIT

```text
Given Active and current index equals requested index
When source delivers an opaque value
Then emit same source value
Then complete
Then release source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ELEMENTAT-MISSING-DEFAULT

```text
Given Active and index not reached and default supplied
When source completes successfully
Then emit fallback
Then complete
Then release source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ELEMENTAT-MISSING-ERROR

```text
Given Active and index not reached and no default
When source completes successfully
Then report ArgumentOutOfRangeError
Then release source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ELEMENTAT-SOURCE-ERROR

```text
Given Active and source fails before indexed value
When source fails with its original error object
Then forward exact source error
Then release source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## ELEMENTAT-CANCEL

```text
Given Active and downstream closes early
When release work silently without completion
Then release source silently
And control and memory updated atomically; resource lifetime follows ordered actions
```
