# findIndex-first-match: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## FINDINDEX-INIT

```text
Given Unsubscribed and fresh execution
When begin a fresh lazy execution
Then subscribe source with index zero
And updated control and memory
```

## FINDINDEX-CALL

```text
Given Active and valid zero-based index
When source delivers an opaque value
Then invoke predicate
And updated control and memory
```

## FINDINDEX-MATCH

```text
Given Calling and correlated truthy result
When correlated predicate returns a truthy/falsy result
Then emit current index
Then complete
Then release source
And terminal state with no owned live work
```

## FINDINDEX-MISS

```text
Given Calling and correlated falsy result
When correlated predicate returns a truthy/falsy result
Then advance index silently
And updated control and memory
```

## FINDINDEX-THROW

```text
Given Calling and correlated predicate throw
When correlated predicate throws
Then error downstream
Then release source
And terminal state with no owned live work
```

## FINDINDEX-NOT-FOUND

```text
Given Active and no value matched
When source completes successfully
Then emit -1
Then complete
Then release source
And terminal state with no owned live work
```

## FINDINDEX-SOURCE-ERROR

```text
Given Active and source errors
When source fails with its original error object
Then forward exact error
Then release source
And terminal state with no owned live work
```

## FINDINDEX-CANCEL

```text
Given Active and downstream closes
When downstream unsubscribes silently
Then release source silently
And terminal state with no owned live work
```
