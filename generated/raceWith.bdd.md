# raceWith-fixed-observables-atomic-subscription: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S17-RACEWITH-SUBSCRIBE

```text
Given Unsubscribed and first result subscription with valid fixed Observable inputs
When connect the race
Then subscribe source input 0 and then every additional input in order
And All source subscriptions live; no winner.
```

## S17-RACEWITH-FIRST-NEXT

```text
Given Racing and any live input emits the first value after connection setup
When candidate emitted value
Then unsubscribe every losing input
Then forward winner payload
And The winning input alone remains live; its index is permanent.
```

## S17-RACEWITH-WINNER-NEXT

```text
Given Winner and value is from selected winner subscription
When candidate emitted value
Then forward next value unchanged
And Winner and resource identity unchanged.
```

## S17-RACEWITH-EARLY-COMPLETE

```text
Given Racing and any racing input completes without a prior next
When candidate completed
Then complete result
Then release every competing subscription
And Closed successfully without a winner.
```

## S17-RACEWITH-EARLY-ERROR

```text
Given Racing and any racing input errors before any first next
When candidate failed
Then forward exact error
Then release every competing subscription
And Closed in error without a winner.
```

## S17-RACEWITH-WINNER-COMPLETE

```text
Given Winner and selected winner completes
When candidate completed
Then complete downstream
Then release winning source
And Closed successfully, original winner remains recorded.
```

## S17-RACEWITH-WINNER-ERROR

```text
Given Winner and selected winner errors
When candidate failed
Then forward exact error
Then release winning source
And Closed with original winner recorded.
```

## S17-RACEWITH-CANCEL-RACE

```text
Given Racing and downstream cancels before a winner
When consumer cancels
Then unsubscribe every candidate without notifying downstream
And Closed by cancellation.
```

## S17-RACEWITH-CANCEL-WINNER

```text
Given Winner and downstream cancels selected source
When consumer cancels
Then unsubscribe winner without downstream terminal notification
And Closed by cancellation.
```
