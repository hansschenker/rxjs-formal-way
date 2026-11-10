# isEmpty-short-circuit: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S13-ISEMPTY-INIT

```text
Given Unsubscribed and new result subscription
When start a fresh lazy execution
Then subscribe source
And updated control and subscription-local memory
```

## S13-ISEMPTY-NONEMPTY

```text
Given Active and first next value
When receive an opaque source value
Then emit false
Then complete
Then unsubscribe source
And terminal with no owned work
```

## S13-ISEMPTY-EMPTY

```text
Given Active and source completed before next
When normal source completion
Then emit true
Then complete
Then release source
And terminal with no owned work
```

## S13-ISEMPTY-ERROR

```text
Given Active and error before first next
When source failure with original error identity
Then forward same error
Then release source
And terminal with no owned work
```

## S13-ISEMPTY-CANCEL

```text
Given Active and consumer closes before result
When silent downstream cancellation
Then release source silently
And terminal with no owned work
```
