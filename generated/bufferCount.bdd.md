# bufferCount-3-every-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## BUFFERCOUNT-INIT

```text
Given Unsubscribed and fresh execution
When connect the operator to its inputs
Then subscribe to source
And no input seen and no open buffers
```

## BUFFERCOUNT-NEXT

```text
Given Active and connected with valid counter
When append the source value to active buffers
Then open on stride boundary, append to all open buffers, emit and remove full buffers
And advance the input counter and retain incomplete buffers
```

## BUFFERCOUNT-SOURCE-COMPLETE

```text
Given Active and connected
When flush open buffers and complete
Then emit all remaining buffers
Then complete downstream
Then release owned subscriptions
And closed and buffers discarded
```

## BUFFERCOUNT-SOURCE-ERROR

```text
Given Active and connected
When discard buffers and propagate error
Then forward original source error
Then release subscriptions without flush
And closed with buffered values discarded
```

## BUFFERCOUNT-CANCEL

```text
Given Active and connected between reactions
When cancel without flushing
Then release subscriptions with no notification
And closed with buffered values discarded
```
