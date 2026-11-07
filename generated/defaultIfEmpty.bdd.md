# defaultIfEmpty-opaque-fallback: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## DEFAULTIFEMPTY-INIT

```text
Given Unsubscribed and new subscription
When start one dataflow execution
Then acquire source
And state with documented resource ownership
```

## DEFAULTIFEMPTY-NEXT

```text
Given Active and source live
When receive opaque source value
Then remember that at least one value arrived
Then forward exact value
And state with documented resource ownership
```

## DEFAULTIFEMPTY-EMPTY

```text
Given Active and no source value was seen
When successful source completion
Then emit configured fallback once
Then complete
Then release source
And terminated; no late events legal
```

## DEFAULTIFEMPTY-NONEMPTY

```text
Given Active and some source next was seen
When successful source completion
Then complete without fallback
Then release source
And terminated; no late events legal
```

## DEFAULTIFEMPTY-ERROR

```text
Given Active and source errored
When source error
Then forward exact error
Then release source; no fallback
And terminated; no late events legal
```

## DEFAULTIFEMPTY-CANCEL

```text
Given Active and downstream unsubscribed
When cancel output
Then release source silently
And terminated; no late events legal
```
