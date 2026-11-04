# bufferTime-3-restart: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## BUFFERTIME-INIT

```text
Given Unsubscribed and fresh clock and representable initial deadlines
When start windows and source
Then schedule initial closing timer
Then schedule creation interval if configured
Then subscribe source
And active with one empty window and optional creation timer
```

## BUFFERTIME-NEXT

```text
Given Active and valid clock, window counter and capacity
When append value to currently open windows
Then append to windows open before this notification
Then close full windows; emit arrays in opening order
Then restart if no creation interval
And active with unfilled buffers and new timer identities
```

## BUFFERTIME-WINDOW-FIRE

```text
Given Active and matching live window and due deadline
When matching window reaches closing time
Then cancel matching timer
Then emit this window, including empty
Then restart if no creation interval
And active with remaining windows and optional new window
```

## BUFFERTIME-SOURCE-COMPLETE

```text
Given Active and valid clock
When emit all active windows and complete
Then emit all remaining buffers in opening order
Then complete downstream
Then cancel timers and release source
And closed with no active windows
```

## BUFFERTIME-SOURCE-ERROR

```text
Given Active and valid clock
When error without flush
Then forward source error unchanged
Then cancel timers and discard all buffered values
Then release source
And closed because of error
```

## BUFFERTIME-CANCEL

```text
Given Active and valid clock between reactions
When drop windows silently
Then cancel all timers
Then release source without downstream notification
And closed with all buffers discarded
```
