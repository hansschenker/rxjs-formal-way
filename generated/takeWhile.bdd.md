# takeWhile-predicate-inclusive: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## TAKEWHILE-INIT

```text
Given Unsubscribed and fresh execution
When a fresh result subscription connects
Then subscribe to the source
And testing with index zero
```

## TAKEWHILE-CALL

```text
Given Testing and index < MAX_SAFE_INTEGER
When the source delivers a value
Then invoke the predicate once with the input and its zero-based index
And calling with retained input, invocation identity and advanced index
```

## TAKEWHILE-TRUE

```text
Given Calling and matching invocation and truthy result
When the pending predicate returns its result
Then forward the original value
And testing with the already advanced index
```

## TAKEWHILE-FALSE

```text
Given Calling and matching invocation and falsy result
When the pending predicate returns its result
Then forward the first predicate-failing value
Then complete downstream
Then release the source
And closed because the predicate failed
```

## TAKEWHILE-THROW

```text
Given Calling and matching pending invocation
When the pending predicate throws
Then forward the thrown value unchanged as an error
Then release the source
And closed because the predicate threw
```

## TAKEWHILE-TESTING-COMPLETE

```text
Given Testing and no unresolved predicate invocation
When the source completes
Then complete downstream
Then release the source
And closed because of complete
```

## TAKEWHILE-TESTING-ERROR

```text
Given Testing and no unresolved predicate invocation
When the source errors
Then forward the source error unchanged
Then release the source
And closed because of source-error
```

## TAKEWHILE-TESTING-CANCEL

```text
Given Testing and no unresolved predicate invocation
When downstream cancels the subscription
Then release the source without notifying downstream
And closed because of cancel
```
