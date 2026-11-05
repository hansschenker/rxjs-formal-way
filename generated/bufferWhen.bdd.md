# bufferWhen-Observable-selector: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## BUFFERWHEN-INIT

```text
Given Unsubscribed and fresh subscription
When start a new operator execution
Then open empty buffer
Then invoke initial closing selector
And await selector
```

## BUFFERWHEN-CALLBACK-RETURN

```text
Given Calling and matching selector generation
When selected Observable is available
Then connect selected closing Observable
Then connect source if first buffer
And retain exact buffer and resource bindings
```

## BUFFERWHEN-CALLBACK-THROW

```text
Given Calling and matching selector generation
When selector threw
Then forward exact thrown error
Then release all owned subscriptions without flush
And terminal
```

## BUFFERWHEN-SOURCE-NEXT

```text
Given Active and source connected
When append to open buffers
Then append source value to every open buffer
And retain exact buffer and resource bindings
```

## BUFFERWHEN-SOURCE-COMPLETE

```text
Given Active and source connected
When flush active buffers then complete
Then flush all open buffers in opening order
Then complete
Then release resources
And terminal
```

## BUFFERWHEN-SOURCE-ERROR

```text
Given Active and source connected
When error without flushing
Then forward error
Then dispose without flush
And terminal
```

## BUFFERWHEN-CANCEL-ACTIVE

```text
Given Active and active execution
When silent disposal
Then release resources; do not notify downstream
And terminal
```

## BUFFERWHEN-CANCEL-CALLING

```text
Given Calling and pending selector call, between microsteps
When silent disposal
Then release owned subscriptions; do not notify
And terminal
```

## BUFFERWHEN-CLOSING-NEXT

```text
Given Active and matching live closing generation
When close selected buffer
Then close previous selector subscription
Then replace with empty buffer
Then emit old array
Then invoke next selector
And await selector
```

## BUFFERWHEN-CLOSING-COMPLETE

```text
Given Active and matching live closing generation
When closing without next does not flush
Then release completed closing subscription; do not flush
And retain exact buffer and resource bindings
```

## BUFFERWHEN-CLOSING-ERROR

```text
Given Active and matching live closing generation
When closing error propagates
Then forward closing error
Then release all resources
And terminal
```
