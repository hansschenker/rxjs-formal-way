# dematerialize-notification-values: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## DEMATERIALIZE-INIT

```text
Given Unsubscribed and fresh subscription
When begin a fresh execution, acquiring the source only now
Then acquire source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## DEMATERIALIZE-NEXT

```text
Given Active and notification.kind=N
When source value is a Notification<T> record
Then forward embedded payload
And control and memory updated atomically; resource lifetime follows ordered actions
```

## DEMATERIALIZE-EMBEDDED-COMPLETE

```text
Given Active and notification.kind=C
When source value is a Notification<T> record
Then complete downstream
Then release source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## DEMATERIALIZE-EMBEDDED-ERROR

```text
Given Active and notification.kind=E
When source value is a Notification<T> record
Then error with embedded identity
Then release source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## DEMATERIALIZE-SOURCE-COMPLETE

```text
Given Active and source completes without embedded terminal
When source completes successfully
Then complete
Then release source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## DEMATERIALIZE-SOURCE-ERROR

```text
Given Active and outer errors
When source fails with its original error object
Then forward source error
Then release source
And control and memory updated atomically; resource lifetime follows ordered actions
```

## DEMATERIALIZE-CANCEL

```text
Given Active and downstream closes
When release work silently without completion
Then release source silently
And control and memory updated atomically; resource lifetime follows ordered actions
```
