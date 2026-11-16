# subscribeOn-virtualFIFO-delay-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S19-SUBSCRIBEON-SCHEDULE

```text
Given Unsubscribed and downstream starts
When fresh subscription
Then schedule subscription action with delay
Then do not acquire source yet
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SUBSCRIBEON-CONNECT

```text
Given Pending and matching scheduler action at/after due time
When scheduled source acquisition fires
Then subscribe source inside scheduled action
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SUBSCRIBEON-PENDING-CANCEL

```text
Given Pending and unsubscribe before scheduled action runs
When consumer cancellation
Then cancel scheduler action; never subscribe source
And Final terminal reason; state is no longer admissible for input.
```

## S19-SUBSCRIBEON-NEXT

```text
Given Active and scheduled source subscription is now live
When value from producer
Then forward source value immediately
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SUBSCRIBEON-COMPLETE

```text
Given Active and live source completes
When producer completed
Then complete and release source
And Final terminal reason; state is no longer admissible for input.
```

## S19-SUBSCRIBEON-ERROR

```text
Given Active and live source fails
When producer failed
Then propagate original error and release source
And Final terminal reason; state is no longer admissible for input.
```

## S19-SUBSCRIBEON-ACTIVE-CANCEL

```text
Given Active and consumer unsubscribes after source acquisition
When consumer cancellation
Then unsubscribe source silently
And Final terminal reason; state is no longer admissible for input.
```
