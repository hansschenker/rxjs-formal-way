# combineLatestWith-1-observable-inputs: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## COMBINELATESTWITH-INIT

```text
Given Unsubscribed and first downstream connection
When connect the output subscription
Then acquire every input in argument order
And valid ordered input bindings
```

## COMBINELATESTWITH-WAIT

```text
Given Active and live source; some other source unready
When one live source delivers a value
Then replace latest value; no output
And valid ordered input bindings
```

## COMBINELATESTWITH-EMIT

```text
Given Active and live source; every other source ready
When one live source delivers a value
Then update one latest value
Then emit copied source-ordered array
And valid ordered input bindings
```

## COMBINELATESTWITH-COMPLETE-WAIT

```text
Given Active and live source; another source remains live
When one live source completes
Then release completing input; retain latest value
And valid ordered input bindings
```

## COMBINELATESTWITH-COMPLETE-LAST

```text
Given Active and final live input
When one live source completes
Then complete downstream
Then release final input
And terminal; resources discarded
```

## COMBINELATESTWITH-ERROR

```text
Given Active and currently subscribed input
When one live source errors
Then propagate original error
Then cancel all active inputs
And terminal; resources discarded
```

## COMBINELATESTWITH-CANCEL

```text
Given Active and downstream cancels
When unsubscribe from result
Then unsubscribe active inputs, no terminal output
And terminal; resources discarded
```
