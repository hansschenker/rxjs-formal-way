# every-indexed-predicate: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## EVERY-INIT

```text
Given Unsubscribed and fresh execution
When begin a fresh execution, acquiring the source only now
Then subscribe source with index zero
And control and memory updated atomically; resource lifetime follows ordered actions
```

## EVERY-CALL

```text
Given Active and source next at valid index
When source delivers an opaque value
Then invoke predicate with original value and index
And control and memory updated atomically; resource lifetime follows ordered actions
```

## EVERY-TRUE

```text
Given Calling and correlated truthy predicate outcome
When pending predicate returns a truthy/falsy result
Then advance index, no output
And control and memory updated atomically; resource lifetime follows ordered actions
```

## EVERY-FALSE

```text
Given Calling and correlated falsy predicate outcome
When pending predicate returns a truthy/falsy result
Then emit false once
Then complete
Then unsubscribe
And control and memory updated atomically; resource lifetime follows ordered actions
```

## EVERY-THROW

```text
Given Calling and correlated throwing predicate
When pending predicate throws an arbitrary error
Then forward exact thrown identity
Then release source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## EVERY-SOURCE-COMPLETE

```text
Given Active and no falsy predicate occurred
When source completes successfully
Then emit true once
Then complete
Then release source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## EVERY-SOURCE-ERROR

```text
Given Active and upstream errors
When source fails with its original error object
Then forward error without boolean
Then release source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## EVERY-CANCEL

```text
Given Active and explicit cancellation
When release work silently without completion
Then release source silently
And control and memory updated atomically; resource lifetime follows ordered actions
```
