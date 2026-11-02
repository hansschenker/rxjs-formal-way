# skipWhile-predicate: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## SKIPWHILE-INIT

```text
Given Unsubscribed and fresh execution
When a fresh result subscription connects
Then subscribe to the source
And testing with index zero
```

## SKIPWHILE-CALL

```text
Given Testing and index < MAX_SAFE_INTEGER
When the source delivers a value
Then invoke the predicate once with the input and its zero-based index
And calling with retained input, invocation identity and advanced index
```

## SKIPWHILE-TRUE

```text
Given Calling and matching invocation and truthy result
When the pending predicate returns its result
Then emit no action
And testing with the already advanced index
```

## SKIPWHILE-FALSE

```text
Given Calling and matching invocation and falsy result
When the pending predicate returns its result
Then forward the first predicate-failing value
And permanently open; predicate no longer called
```

## SKIPWHILE-OPEN-PASS

```text
Given Open and gate has opened
When the source delivers a value
Then forward the incoming value without invoking the predicate
And still permanently open
```

## SKIPWHILE-THROW

```text
Given Calling and matching pending invocation
When the pending predicate throws
Then forward the thrown value unchanged as an error
Then release the source
And closed because the predicate threw
```

## SKIPWHILE-TESTING-COMPLETE

```text
Given Testing and no unresolved predicate invocation
When the source completes
Then complete downstream
Then release the source
And closed because of complete
```

## SKIPWHILE-TESTING-ERROR

```text
Given Testing and no unresolved predicate invocation
When the source errors
Then forward the source error unchanged
Then release the source
And closed because of source-error
```

## SKIPWHILE-TESTING-CANCEL

```text
Given Testing and no unresolved predicate invocation
When downstream cancels the subscription
Then release the source without notifying downstream
And closed because of cancel
```

## SKIPWHILE-OPEN-COMPLETE

```text
Given Open and no unresolved predicate invocation
When the source completes
Then complete downstream
Then release the source
And closed because of complete
```

## SKIPWHILE-OPEN-ERROR

```text
Given Open and no unresolved predicate invocation
When the source errors
Then forward the source error unchanged
Then release the source
And closed because of source-error
```

## SKIPWHILE-OPEN-CANCEL

```text
Given Open and no unresolved predicate invocation
When downstream cancels the subscription
Then release the source without notifying downstream
And closed because of cancel
```
