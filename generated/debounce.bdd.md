# debounce-Observable-duration: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## DEBOUNCE-INIT

```text
Given Unsubscribed and fresh subscription
When connect source
Then subscribe source
And state with documented resource ownership
```

## DEBOUNCE-NEW-VALUE

```text
Given Active and source live; pending duration may exist
When replace pending source value
Then cancel old duration if live
Then replace cached value
Then invoke duration selector
And state with documented resource ownership
```

## DEBOUNCE-DURATION-RETURN

```text
Given Calling and matching pending selector invocation
When duration selector returns Observable
Then subscribe selected duration Observable
And state with documented resource ownership
```

## DEBOUNCE-DURATION-THROW

```text
Given Calling and matching selector invocation
When duration selector throws
Then propagate exact thrown error
Then release source
And terminated; no late events legal
```

## DEBOUNCE-DURATION-NEXT

```text
Given Active and matching live duration
When current duration releases value
Then unsubscribe duration
Then emit cached latest value once
And state with documented resource ownership
```

## DEBOUNCE-DURATION-EMPTY

```text
Given Active and matching live duration completed without next
When current duration finishes without emission
Then release duration; retain latest value
And state with documented resource ownership
```

## DEBOUNCE-DURATION-ERROR

```text
Given Active and matching live duration
When duration errors
Then propagate exact error
Then release duration and source
And terminated; no late events legal
```

## DEBOUNCE-SOURCE-COMPLETE

```text
Given Active and source completes
When complete and flush
Then cancel live duration
Then flush cached value if present
Then complete
Then release source
And terminated; no late events legal
```

## DEBOUNCE-SOURCE-ERROR-ACTIVE

```text
Given Active and source errors
When source error
Then forward error and release owned resources
And terminated; no late events legal
```

## DEBOUNCE-CANCEL-ACTIVE

```text
Given Active and downstream cancels
When silent cancellation
Then release active duration and source silently
And terminated; no late events legal
```

## DEBOUNCE-SOURCE-ERROR-CALLING

```text
Given Calling and source errors
When source error
Then forward error and release owned resources
And terminated; no late events legal
```

## DEBOUNCE-CANCEL-CALLING

```text
Given Calling and downstream cancels
When silent cancellation
Then release active duration and source silently
And terminated; no late events legal
```
