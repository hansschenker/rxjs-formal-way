# catchError-one-Observable-replacement: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## CATCHERROR-INIT

```text
Given Unsubscribed and fresh execution
When start source subscription
Then subscribe original source
And await or execute selected source
```

## CATCHERROR-SOURCE-NEXT

```text
Given Source and original connected
When forward original value
Then forward exact value
And await or execute selected source
```

## CATCHERROR-SOURCE-ERROR

```text
Given Source and source connected
When invoke recovery selector
Then request recovery selector with error and caught source
And await or execute selected source
```

## CATCHERROR-SELECTOR-RETURN

```text
Given Calling and matching callback resource
When replacement Observable returned
Then release original source
Then subscribe replacement Observable
And await or execute selected source
```

## CATCHERROR-SELECTOR-THROW

```text
Given Calling and matching selector (or synchronous throw without resource)
When recovery selector threw
Then error with thrown value
Then release source
And closed
```

## CATCHERROR-SOURCE-COMPLETE

```text
Given Source and original connected
When complete without selector
Then complete
Then release original source
And closed
```

## CATCHERROR-REPLACEMENT-NEXT

```text
Given Replacement and replacement connected
When forward replacement value
Then forward replacement value
And await or execute selected source
```

## CATCHERROR-REPLACEMENT-COMPLETE

```text
Given Replacement and replacement connected
When complete replacement
Then complete
Then release replacement
And closed
```

## CATCHERROR-REPLACEMENT-ERROR

```text
Given Replacement and replacement connected
When propagate replacement error without catching again
Then propagate replacement error
Then release replacement
And closed
```

## CATCHERROR-CANCEL-SOURCE

```text
Given Source and active subscription
When silent teardown
Then unsubscribe current resource without output
And closed
```

## CATCHERROR-CANCEL-CALLING

```text
Given Calling and active subscription
When silent teardown
Then unsubscribe current resource without output
And closed
```

## CATCHERROR-CANCEL-REPLACEMENT

```text
Given Replacement and active subscription
When silent teardown
Then unsubscribe current resource without output
And closed
```
