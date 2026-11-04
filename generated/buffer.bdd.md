# buffer-Observable-closing-notifier: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## BUFFER-INIT

```text
Given Unsubscribed and fresh execution
When connect the operator to its inputs
Then subscribe source, then notifier
And no input seen and no open buffers
```

## BUFFER-NEXT

```text
Given Active and connected with valid counter
When append the source value to active buffers
Then append to the current buffer
And advance the input counter and retain incomplete buffers
```

## BUFFER-SOURCE-COMPLETE

```text
Given Active and connected
When flush open buffers and complete
Then emit all remaining buffers
Then complete downstream
Then release owned subscriptions
And closed and buffers discarded
```

## BUFFER-SOURCE-ERROR

```text
Given Active and connected
When discard buffers and propagate error
Then forward original source error
Then release subscriptions without flush
And closed with buffered values discarded
```

## BUFFER-CANCEL

```text
Given Active and connected between reactions
When cancel without flushing
Then release subscriptions with no notification
And closed with buffered values discarded
```

## BUFFER-NOTIFIER-NEXT

```text
Given Active and closing notifier still active
When emit and reset current buffer
Then emit the current buffer, including empty; start a fresh empty buffer
And active with a new empty buffer
```

## BUFFER-NOTIFIER-COMPLETE

```text
Given Active and closing notifier still active
When stop notifier; source keeps running
Then release completed notifier but keep collecting source values
And active with the same accumulated buffer
```

## BUFFER-NOTIFIER-ERROR

```text
Given Active and closing notifier still active
When error downstream and release source
Then forward original notifier error
Then release subscriptions without flush
And closed and values discarded
```
