# single-indexed-predicate: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S19-SINGLE-START

```text
Given Unsubscribed and first downstream subscriber
When fresh subscription
Then subscribe source; initialize presence bits and index
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SINGLE-CANDIDATE

```text
Given Active and no predicate and no previous candidate
When value from producer
Then retain first source value without notifying
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SINGLE-SECOND

```text
Given Active and no predicate and candidate already stored
When value from producer
Then error with SequenceError; unsubscribe source
And Final terminal reason; state is no longer admissible for input.
```

## S19-SINGLE-PREDICATE

```text
Given Active and predicate selected and index safe
When value from producer
Then request indexed predicate for original source value
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SINGLE-REJECT

```text
Given Calling and correlated false predicate result
When correlated predicate boolean
Then advance predicate index; retain previous candidate if any
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SINGLE-FIRST-MATCH

```text
Given Calling and correlated true result and no prior match
When correlated predicate boolean
Then retain original source value; advance predicate index
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SINGLE-DUPLICATE-MATCH

```text
Given Calling and correlated true result and prior matching value exists
When correlated predicate boolean
Then error with SequenceError; release source immediately
And Final terminal reason; state is no longer admissible for input.
```

## S19-SINGLE-PREDICATE-THROW

```text
Given Calling and correlated predicate exception
When correlated thrown object
Then propagate exact thrown object; release source
And Final terminal reason; state is no longer admissible for input.
```

## S19-SINGLE-FOUND

```text
Given Active and one matching candidate stored
When producer completed
Then emit retained original value; complete; release source
And Final terminal reason; state is no longer admissible for input.
```

## S19-SINGLE-EMPTY

```text
Given Active and no source values ever observed
When producer completed
Then emit EmptyError; release source
And Final terminal reason; state is no longer admissible for input.
```

## S19-SINGLE-NOT-FOUND

```text
Given Active and source was non-empty but predicate matched nothing
When producer completed
Then emit NotFoundError; release source
And Final terminal reason; state is no longer admissible for input.
```

## S19-SINGLE-SOURCE-ERROR

```text
Given Active and live source fails
When producer failed
Then forward exact source error; release source
And Final terminal reason; state is no longer admissible for input.
```

## S19-SINGLE-CANCEL-ACTIVE

```text
Given Active and consumer cancels
When consumer cancellation
Then release source without a next/error/complete notification
And Final terminal reason; state is no longer admissible for input.
```

## S19-SINGLE-CANCEL-CALLING

```text
Given Calling and consumer cancels
When consumer cancellation
Then release source without a next/error/complete notification
And Final terminal reason; state is no longer admissible for input.
```
