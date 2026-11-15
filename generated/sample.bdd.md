# sample-source-first-notifier: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S18-SAMPLE-START

```text
Given Unsubscribed and first result subscription
When start the result
Then subscribe source before notifier
And Listening with no remembered value and one sampling mechanism.
```

## S18-SAMPLE-REMEMBER

```text
Given Listening and live source emission (any payload)
When record latest value
Then replace remembered value with exact payload; no downstream notification
And hasValue=true; lastValue replaced.
```

## S18-SAMPLE-NOTIFIER-EMIT

```text
Given Listening and notifier next with pending value
When sample on notifier next
Then emit latest value once and clear presence
And Clear remembered presence on every sample.
```

## S18-SAMPLE-NOTIFIER-EMPTY

```text
Given Listening and notifier next with no value since last sample
When sample on notifier next
Then do not emit
And Clear remembered presence on every sample.
```

## S18-SAMPLE-NOTIFIER-COMPLETE

```text
Given Listening and notifier is open; completion is not a sampling notification
When notifier ends without sampling
Then release notifier; do not flush latest value or terminate source
And Source continues with notifier completed and unsampled memory retained.
```

## S18-SAMPLE-NOTIFIER-ERROR

```text
Given Listening and notifier is open
When notifier fails
Then forward exact error
Then teardown source and notifier
And Closed on error.
```

## S18-SAMPLE-COMPLETE

```text
Given Listening and source completes
When complete result immediately
Then complete immediately, without flushing pending value
Then release source and sampling mechanism
And Closed complete.
```

## S18-SAMPLE-ERROR

```text
Given Listening and source fails
When fail result immediately
Then forward exact error immediately
Then release source and sampling mechanism
And Closed error.
```

## S18-SAMPLE-CANCEL

```text
Given Listening and consumer cancels
When cancel result
Then release subscriptions or timer; never notify
And Closed cancel.
```
