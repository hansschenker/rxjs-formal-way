# observeOn-virtual-fifo-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S15-OBSERVEON-INIT

```text
Given Unsubscribed and first subscription
When connect source
Then subscribe source
And ordered notifications and source ownership retained
```

## S15-OBSERVEON-QUEUE-NEXT

```text
Given Active and source live and time is valid
When queue a source value
Then queue one scheduled next
And ordered notifications and source ownership retained
```

## S15-OBSERVEON-QUEUE-COMPLETE

```text
Given Active and source live and time valid
When queue source completion
Then queue scheduled completion
Then release source
And ordered notifications and source ownership retained
```

## S15-OBSERVEON-QUEUE-ERROR

```text
Given Active and source live and time valid
When queue source error
Then queue original error
Then release source
And ordered notifications and source ownership retained
```

## S15-OBSERVEON-FIRE-NEXT

```text
Given Active and head scheduled notification is next and due
When scheduler executes queued action
Then emit remembered payload
Then retire timer
And ordered notifications and source ownership retained
```

## S15-OBSERVEON-FIRE-COMPLETE

```text
Given Active and head scheduled completion is due
When scheduler executes queued action
Then complete result
Then retire timer
And terminal; no scheduled notifications remain
```

## S15-OBSERVEON-FIRE-ERROR

```text
Given Active and head scheduled source error is due
When scheduler executes queued action
Then forward exact original error
Then retire timer
And terminal; no scheduled notifications remain
```

## S15-OBSERVEON-CANCEL

```text
Given Active and downstream unsubscribed
When cancel scheduled work
Then cancel all scheduled actions
Then release live source, no terminal
And terminal; no scheduled notifications remain
```
