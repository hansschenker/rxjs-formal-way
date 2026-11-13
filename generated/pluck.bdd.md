# pluck-plain-data-path: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S16-PLUCK-INIT

```text
Given Unsubscribed and first downstream connection
When start independent source
Then subscribe one source
And Active with zero projected values.
```

## S16-PLUCK-NEXT

```text
Given Active and plain-data property path can be read
When receive data
Then emit one nested property value, including undefined
And Active with source value count increased by one.
```

## S16-PLUCK-COMPLETE

```text
Given Active and source completes
When complete source
Then forward completion and release source
And Closed complete; no source ownership.
```

## S16-PLUCK-ERROR

```text
Given Active and source errors
When source failure
Then forward exact error and release source
And Closed error; no source ownership.
```

## S16-PLUCK-CANCEL

```text
Given Active and downstream cancels
When downstream unsubscribe
Then release source without notifying downstream
And Closed cancelled; no source ownership.
```
