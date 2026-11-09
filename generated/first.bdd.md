# first-predicate-required: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## FIRST-INIT

```text
Given Unsubscribed and fresh execution
When begin a fresh lazy execution
Then subscribe source
And updated control and memory
```

## FIRST-DIRECT

```text
Given Active and predicate omitted
When source delivers an opaque value
Then emit first source value
Then complete
Then release source
And terminal state with no owned live work
```

## FIRST-CALL

```text
Given Active and predicate supplied and index valid
When source delivers an opaque value
Then invoke predicate
And updated control and memory
```

## FIRST-MATCH

```text
Given Calling and correlated truthy predicate result
When correlated predicate returns a truthy/falsy result
Then emit original matched value
Then complete
Then release source
And terminal state with no owned live work
```

## FIRST-MISS

```text
Given Calling and correlated falsy predicate result
When correlated predicate returns a truthy/falsy result
Then advance predicate index silently
And updated control and memory
```

## FIRST-THROW

```text
Given Calling and correlated predicate throw
When correlated predicate throws
Then error downstream
Then release source
And terminal state with no owned live work
```

## FIRST-EMPTY-DEFAULT

```text
Given Active and no admissible value and explicit default supplied
When source completes successfully
Then emit default
Then complete
Then release source
And terminal state with no owned live work
```

## FIRST-EMPTY-ERROR

```text
Given Active and no admissible value and no default
When source completes successfully
Then error with EmptyError
Then release source
And terminal state with no owned live work
```

## FIRST-SOURCE-ERROR

```text
Given Active and source errors
When source fails with its original error object
Then forward exact error
Then release source
And terminal state with no owned live work
```

## FIRST-CANCEL

```text
Given Active and downstream closes
When downstream unsubscribes silently
Then release source silently
And terminal state with no owned live work
```
