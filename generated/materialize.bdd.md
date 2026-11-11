# materialize-notifications: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S14-MATERIALIZE-INIT

```text
Given Unsubscribed and first consumer subscription
When start lazy execution
Then subscribe source
And one subscribed source
```

## S14-MATERIALIZE-NEXT

```text
Given Active and source next value, including undefined
When source payload
Then emit N Notification as next
And one subscribed source
```

## S14-MATERIALIZE-END

```text
Given Active and source completes normally
When source normal end
Then emit C Notification as next
Then complete output
Then release source
And no owned source and no legal late events
```

## S14-MATERIALIZE-FAIL

```text
Given Active and source errors
When source failure
Then emit E Notification as next
Then complete output
Then release source
And no owned source and no legal late events
```

## S14-MATERIALIZE-CANCEL

```text
Given Active and consumer cancels
When consumer cancellation
Then release source without notifications
And no owned source and no legal late events
```
