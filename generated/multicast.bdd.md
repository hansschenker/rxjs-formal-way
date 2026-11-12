# multicast-factory-selector-two-branches: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S15-MULTICAST-INIT

```text
Given Unsubscribed and fresh subscriber
When new connect result subscription
Then create local Subject
Then request configured selector before source connection
And state with documented resource ownership
```

## S15-MULTICAST-SELECTOR-READY

```text
Given Preparing and matching selected Observable
When configured selector returns Observable
Then subscribe the selected output and its two shared branches
Then only then subscribe original source
And state with documented resource ownership
```

## S15-MULTICAST-SELECTOR-THROW

```text
Given Preparing and selector threw before source subscription
When selector construction failed
Then error without subscribing source
And terminated; no late events legal
```

## S15-MULTICAST-BROADCAST

```text
Given Active and source subscribed through Subject
When single producer emission
Then broadcast opaque value to branch 1
Then broadcast same value to branch 2
And state with documented resource ownership
```

## S15-MULTICAST-COMPLETE

```text
Given Active and source completes
When producer completes
Then Subject completes selected branches
Then complete result
Then tear down selected then source
And terminated; no late events legal
```

## S15-MULTICAST-ERROR

```text
Given Active and source errors
When producer errors
Then Subject errors selected branches
Then forward original error
Then release both subscriptions
And terminated; no late events legal
```

## S15-MULTICAST-CANCEL

```text
Given Active and downstream cancels
When cancel result
Then tear down selected and source, no terminal notification
And terminated; no late events legal
```
