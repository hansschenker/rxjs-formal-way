# combineLatestAll-deferred-latest-array: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## COMBINELATESTALL-INIT

```text
Given Unsubscribed and fresh subscription
When start outer subscription
Then connect outer
And preserve ordered source and latest bindings
```

## COMBINELATESTALL-OUTER-NEXT

```text
Given Collecting and outer still open; bounded count
When store inner source token
Then retain source identity in arrival order
And preserve ordered source and latest bindings
```

## COMBINELATESTALL-OUTER-EMPTY

```text
Given Collecting and no collected inner sources
When start all inner sources or complete for empty outer
Then complete without value
Then release outer
And terminal
```

## COMBINELATESTALL-OUTER-JOIN

```text
Given Collecting and at least one collected inner source
When start all inner sources or complete for empty outer
Then release outer
Then subscribe all collected inner sources in arrival order
And preserve ordered source and latest bindings
```

## COMBINELATESTALL-OUTER-ERROR

```text
Given Collecting and outer still active
When terminate without subscribing any inner
Then error without joining any inners
Then release outer
And terminal
```

## COMBINELATESTALL-INNER-WAIT

```text
Given Joining and live inner and at least one slot remains unready
When update latest slot and maybe emit tuple
Then record latest and first-value status; no output
And preserve ordered source and latest bindings
```

## COMBINELATESTALL-INNER-EMIT

```text
Given Joining and live inner and every other slot ready
When update latest slot and maybe emit tuple
Then update one latest value
Then emit fresh ordered tuple
And preserve ordered source and latest bindings
```

## COMBINELATESTALL-INNER-COMPLETE-WAIT

```text
Given Joining and live inner and another still live
When mark inner finished, terminate when all finished
Then release completed inner, retain its last value
And preserve ordered source and latest bindings
```

## COMBINELATESTALL-INNER-COMPLETE-LAST

```text
Given Joining and final live inner
When mark inner finished, terminate when all finished
Then complete
Then release final inner
And terminal
```

## COMBINELATESTALL-INNER-ERROR

```text
Given Joining and matching live inner
When error and dispose every active inner
Then error immediately
Then release all live inner subscriptions
And terminal
```

## COMBINELATESTALL-CANCEL-COLLECT

```text
Given Collecting and outer live
When silent cancellation
Then release outer silently
And terminal
```

## COMBINELATESTALL-CANCEL-JOIN

```text
Given Joining and join live
When silent cancellation
Then release live inners silently
And terminal
```
