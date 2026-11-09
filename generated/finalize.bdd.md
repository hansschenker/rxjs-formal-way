# finalize-teardown-callback: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## FINALIZE-INIT

```text
Given Unsubscribed and fresh execution
When begin a fresh lazy execution
Then subscribe source
And updated control and memory
```

## FINALIZE-PASS

```text
Given Active and source live
When source delivers an opaque value
Then forward exact value
And updated control and memory
```

## FINALIZE-COMPLETE

```text
Given Active and source completes
When source completes successfully
Then complete downstream
Then release source
Then invoke finalizer once
And terminal state with no owned live work
```

## FINALIZE-ERROR

```text
Given Active and source errors
When source fails with its original error object
Then error downstream
Then release source
Then invoke finalizer once
And terminal state with no owned live work
```

## FINALIZE-CANCEL

```text
Given Active and explicit unsubscribe
When downstream unsubscribes silently
Then release source
Then invoke finalizer once
And terminal state with no owned live work
```
