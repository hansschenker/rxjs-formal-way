# sampleTime-source-first-3: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S18-SAMPLETIME-START

```text
Given Unsubscribed and first result subscription
When start the result
Then subscribe source
Then schedule first virtual tick
And Listening with no remembered value and one sampling mechanism.
```

## S18-SAMPLETIME-REMEMBER

```text
Given Listening and live source emission (any payload)
When record latest value
Then replace remembered value with exact payload; no downstream notification
And hasValue=true; lastValue replaced.
```

## S18-SAMPLETIME-TICK-EMIT

```text
Given Listening and current scheduled tick reaches due time; hasValue=true
When virtual scheduled sampling tick
Then emit latest unsampled value
Then schedule following tick
And No pending value and next periodic tick advances.
```

## S18-SAMPLETIME-TICK-EMPTY

```text
Given Listening and current scheduled tick reaches due time; hasValue=false
When virtual scheduled sampling tick
Then schedule following tick without output
And No pending value and next periodic tick advances.
```

## S18-SAMPLETIME-COMPLETE

```text
Given Listening and source completes
When complete result immediately
Then complete immediately, without flushing pending value
Then release source and sampling mechanism
And Closed complete.
```

## S18-SAMPLETIME-ERROR

```text
Given Listening and source fails
When fail result immediately
Then forward exact error immediately
Then release source and sampling mechanism
And Closed error.
```

## S18-SAMPLETIME-CANCEL

```text
Given Listening and consumer cancels
When cancel result
Then release subscriptions or timer; never notify
And Closed cancel.
```
