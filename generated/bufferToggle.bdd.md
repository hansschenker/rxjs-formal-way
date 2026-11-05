# bufferToggle-Observable-selector: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## BUFFERTOGGLE-INIT

```text
Given Unsubscribed and fresh subscription
When start a new operator execution
Then connect openings
Then connect source
And retain exact buffer and resource bindings
```

## BUFFERTOGGLE-CALLBACK-RETURN

```text
Given Calling and matching selector generation
When selected Observable is available
Then connect selected closing Observable
Then connect source if first buffer
And retain exact buffer and resource bindings
```

## BUFFERTOGGLE-CALLBACK-THROW

```text
Given Calling and matching selector generation
When selector threw
Then forward exact thrown error
Then release all owned subscriptions without flush
And terminal
```

## BUFFERTOGGLE-SOURCE-NEXT

```text
Given Active and source connected
When append to open buffers
Then append source value to every open buffer
And retain exact buffer and resource bindings
```

## BUFFERTOGGLE-SOURCE-COMPLETE

```text
Given Active and source connected
When flush active buffers then complete
Then flush all open buffers in opening order
Then complete
Then release resources
And terminal
```

## BUFFERTOGGLE-SOURCE-ERROR

```text
Given Active and source connected
When error without flushing
Then forward error
Then dispose without flush
And terminal
```

## BUFFERTOGGLE-CANCEL-ACTIVE

```text
Given Active and active execution
When silent disposal
Then release resources; do not notify downstream
And terminal
```

## BUFFERTOGGLE-CANCEL-CALLING

```text
Given Calling and pending selector call, between microsteps
When silent disposal
Then release owned subscriptions; do not notify
And terminal
```

## BUFFERTOGGLE-CLOSING-NEXT

```text
Given Active and matching live closing generation
When close selected buffer
Then remove selected buffer
Then emit array
Then unsubscribe selected closing
And retain exact buffer and resource bindings
```

## BUFFERTOGGLE-CLOSING-COMPLETE

```text
Given Active and matching live closing generation
When closing without next does not flush
Then release completed closing subscription; do not flush
And retain exact buffer and resource bindings
```

## BUFFERTOGGLE-CLOSING-ERROR

```text
Given Active and matching live closing generation
When closing error propagates
Then forward closing error
Then release all resources
And terminal
```

## BUFFERTOGGLE-OPENINGS-NEXT

```text
Given Active and openings still subscribed, safe generation
When open an additional buffer
Then add open buffer
Then invoke closing selector with opening value
And await selector
```

## BUFFERTOGGLE-OPENINGS-COMPLETE

```text
Given Active and openings still subscribed
When stop opening but keep source
Then release openings subscription; preserve buffers and source
And retain exact buffer and resource bindings
```

## BUFFERTOGGLE-OPENINGS-ERROR

```text
Given Active and openings still subscribed
When openings error propagates
Then forward error
Then release all resources without flush
And terminal
```
