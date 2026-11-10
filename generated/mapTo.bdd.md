# mapTo-constant: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S13-MAPTO-INIT

```text
Given Unsubscribed and new subscription
When start a fresh lazy execution
Then subscribe source
And updated control and subscription-local memory
```

## S13-MAPTO-REPLACE

```text
Given Active and every input next
When receive an opaque source value
Then emit original constant instance
And updated control and subscription-local memory
```

## S13-MAPTO-COMPLETE

```text
Given Active and source completes
When normal source completion
Then complete
Then release source
And terminal with no owned work
```

## S13-MAPTO-ERROR

```text
Given Active and source errors
When source failure with original error identity
Then forward error
Then release source
And terminal with no owned work
```

## S13-MAPTO-CANCEL

```text
Given Active and downstream cancels
When silent downstream cancellation
Then release source silently
And terminal with no owned work
```
