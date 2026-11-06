# concat-2-observable-inputs: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## CONCAT-INIT

```text
Given Unsubscribed and first downstream connection
When connect the output subscription
Then acquire source index zero
And valid ordered input bindings
```

## CONCAT-NEXT

```text
Given Active and only active input
When one live source delivers a value
Then forward value unchanged
And valid ordered input bindings
```

## CONCAT-COMPLETE-ADVANCE

```text
Given Active and next input exists
When one live source completes
Then release current input
Then connect next source
And valid ordered input bindings
```

## CONCAT-COMPLETE-LAST

```text
Given Active and last input has completed
When one live source completes
Then complete downstream
Then release final input
And terminal; resources discarded
```

## CONCAT-ERROR

```text
Given Active and currently subscribed input
When one live source errors
Then propagate original error
Then cancel all active inputs
And terminal; resources discarded
```

## CONCAT-CANCEL

```text
Given Active and downstream cancels
When unsubscribe from result
Then unsubscribe active inputs, no terminal output
And terminal; resources discarded
```
