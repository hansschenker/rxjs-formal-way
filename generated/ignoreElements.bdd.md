# ignoreElements-discard-next: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S13-IGNOREELEMENTS-INIT

```text
Given Unsubscribed and new result subscription
When start a fresh lazy execution
Then subscribe source
And updated control and subscription-local memory
```

## S13-IGNOREELEMENTS-DROP

```text
Given Active and every source value
When receive an opaque source value
Then no downstream next
And updated control and subscription-local memory
```

## S13-IGNOREELEMENTS-COMPLETE

```text
Given Active and normal termination
When normal source completion
Then forward complete
Then release source
And terminal with no owned work
```

## S13-IGNOREELEMENTS-ERROR

```text
Given Active and failure
When source failure with original error identity
Then forward identical error
Then release source
And terminal with no owned work
```

## S13-IGNOREELEMENTS-CANCEL

```text
Given Active and downstream unsubscribed
When silent downstream cancellation
Then release source silently
And terminal with no owned work
```
