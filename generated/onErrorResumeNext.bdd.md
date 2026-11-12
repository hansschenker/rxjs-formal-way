# onErrorResumeNext-pipeable-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S15-ONERRORRESUMENEXT-INIT

```text
Given Unsubscribed and first subscription
When start result
Then connect piped source index 0
And one current subscription; others waiting
```

## S15-ONERRORRESUMENEXT-NEXT

```text
Given Active and matching current source
When current source value
Then forward opaque input value
And one current subscription; others waiting
```

## S15-ONERRORRESUMENEXT-COMPLETE-ADVANCE

```text
Given Active and current input terminal and one later input remains
When current source completed
Then release current
Then subscribe next input
And one current subscription; others waiting
```

## S15-ONERRORRESUMENEXT-COMPLETE-LAST

```text
Given Active and final current input terminates
When current source completed
Then release final input
Then complete result without propagating error
And all source subscriptions released
```

## S15-ONERRORRESUMENEXT-ERROR-ADVANCE

```text
Given Active and current input terminal and one later input remains
When current source failed; swallow error
Then release current
Then subscribe next input
And one current subscription; others waiting
```

## S15-ONERRORRESUMENEXT-ERROR-LAST

```text
Given Active and final current input terminates
When current source failed; swallow error
Then release final input
Then complete result without propagating error
And all source subscriptions released
```

## S15-ONERRORRESUMENEXT-CANCEL

```text
Given Active and downstream cancellation
When cancel result
Then unsubscribe current; no output terminal
And all source subscriptions released
```
