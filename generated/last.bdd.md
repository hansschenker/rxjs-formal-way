# last-predicate-required: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S13-LAST-INIT

```text
Given Unsubscribed and fresh subscription
When start a fresh lazy execution
Then subscribe source
And updated control and subscription-local memory
```

## S13-LAST-TAKE

```text
Given Active and no predicate configured
When receive an opaque source value
Then store last value; no output
And updated control and subscription-local memory
```

## S13-LAST-CHECK

```text
Given Active and predicate configured and source value arrives
When receive an opaque source value
Then invoke indexed predicate
And updated control and subscription-local memory
```

## S13-LAST-MATCH

```text
Given Calling and correlated callback returned truthy
When indexed predicate returned truthy or falsy
Then remember pending value
And updated control and subscription-local memory
```

## S13-LAST-REJECT

```text
Given Calling and correlated callback returned falsy
When indexed predicate returned truthy or falsy
Then keep previous candidate
And updated control and subscription-local memory
```

## S13-LAST-PREDICATE-ERROR

```text
Given Calling and correlated callback throws
When indexed predicate threw the original error object
Then forward same error
Then release source
And terminal with no owned work
```

## S13-LAST-EMIT-LAST

```text
Given Active and candidate exists
When normal source completion
Then emit last candidate
Then complete
Then release source
And terminal with no owned work
```

## S13-LAST-EMIT-DEFAULT

```text
Given Active and no candidate and default was explicitly supplied
When normal source completion
Then emit fallback
Then complete
Then release source
And terminal with no owned work
```

## S13-LAST-EMPTY-ERROR

```text
Given Active and no candidate and default absent
When normal source completion
Then emit EmptyError
Then release source
And terminal with no owned work
```

## S13-LAST-SOURCE-ERROR

```text
Given Active and source errors
When source failure with original error identity
Then forward exact error
Then release source
And terminal with no owned work
```

## S13-LAST-CANCEL

```text
Given Active and consumer closes
When silent downstream cancellation
Then release source silently
And terminal with no owned work
```
