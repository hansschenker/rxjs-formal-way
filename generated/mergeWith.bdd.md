# mergeWith-unbounded-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## S15-MERGEWITH-INIT

```text
Given Unsubscribed and first consumer connection
When connect result
Then subscribe source first then available others
And live and pending indices respect FIFO admission
```

## S15-MERGEWITH-NEXT

```text
Given Active and resource is currently subscribed
When value from a subscribed source
Then forward exact payload
And live and pending indices respect FIFO admission
```

## S15-MERGEWITH-REFILL

```text
Given Active and live input complete and pending FIFO is nonempty
When one input completed
Then release completed input
Then subscribe next waiting input
And live and pending indices respect FIFO admission
```

## S15-MERGEWITH-COMPLETE-WAIT

```text
Given Active and pending empty and other inputs live
When one input completed
Then release completed input
And live and pending indices respect FIFO admission
```

## S15-MERGEWITH-COMPLETE-LAST

```text
Given Active and pending empty, final live input
When one input completed
Then complete result
Then release final input
And terminal, no subscriptions
```

## S15-MERGEWITH-ERROR

```text
Given Active and any live source fails
When one input failed
Then forward exact error
Then release every subscribed input
And terminal, no subscriptions
```

## S15-MERGEWITH-CANCEL

```text
Given Active and consumer unsubscribe
When consumer unsubscribed
Then release all live sources, no notification
And terminal, no subscriptions
```
