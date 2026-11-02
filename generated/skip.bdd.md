# skip-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## SKIP-INIT

```text
Given Unsubscribed and fresh execution
When a fresh result subscription connects
Then subscribe to the source
And active at index zero
```

## SKIP-DROP

```text
Given Active and index < count and index < MAX_SAFE_INTEGER
When the source delivers a value
Then emit no action
And active with the source index increased by one
```

## SKIP-PASS

```text
Given Active and count <= index < MAX_SAFE_INTEGER
When the source delivers a value
Then forward the incoming value unchanged
And active with the source index increased by one
```

## SKIP-COMPLETE

```text
Given Active and active source connection
When the source completes
Then complete downstream
Then release the source
And closed because of complete
```

## SKIP-ERROR

```text
Given Active and active source connection
When the source errors
Then forward the original error
Then release the source
And closed because of source-error
```

## SKIP-CANCEL

```text
Given Active and active source connection
When downstream cancels the subscription
Then release the source without notifying downstream
And closed because of cancel
```
