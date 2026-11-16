# skipLast-FIFO-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S19-SKIPLAST-START

```text
Given Unsubscribed and first subscription
When fresh subscription
Then subscribe source with empty FIFO
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SKIPLAST-IDENTITY

```text
Given Active and count is zero
When value from producer
Then forward value immediately
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SKIPLAST-BUFFER

```text
Given Active and nonzero count and FIFO is not full
When value from producer
Then enqueue source value silently
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SKIPLAST-RELEASE-OLDEST

```text
Given Active and positive count and FIFO already full
When value from producer
Then replace oldest buffered value with new source value
Then then emit previous oldest
And Retain precisely the state memory and resource ownership described by this rule.
```

## S19-SKIPLAST-COMPLETE

```text
Given Active and source completes successfully
When producer completed
Then drop still-buffered suffix
Then complete without flushing
And Final terminal reason; state is no longer admissible for input.
```

## S19-SKIPLAST-ERROR

```text
Given Active and source fails
When producer failed
Then drop FIFO and propagate exact error
Then release source
And Final terminal reason; state is no longer admissible for input.
```

## S19-SKIPLAST-CANCEL

```text
Given Active and consumer cancels
When consumer cancellation
Then drop FIFO and unsubscribe silently
And Final terminal reason; state is no longer admissible for input.
```
