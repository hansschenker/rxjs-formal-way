# startWith-unscheduled-2: Convertible BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

## STARTWITH-INIT-EMPTY

```text
Given Unsubscribed and zero supplied values
When fresh downstream subscription begins prefix delivery
Then subscribe source immediately
And active with source subscription
```

## STARTWITH-INIT-PREFIX

```text
Given Unsubscribed and one or more prefix values
When fresh downstream subscription begins prefix delivery
Then begin synchronous prefix delivery without subscribing to source
And prefix phase with index zero
```

## STARTWITH-EMIT

```text
Given Prefix and prefix index < configured length
When next configured prefix item is delivered synchronously
Then emit the current prefix payload synchronously
And prefix phase with advanced index
```

## STARTWITH-CONNECT

```text
Given Prefix and every prefix value emitted
When all prefix notifications finished; connect to source
Then subscribe source after the last prefix notification returns
And active; source now subscribed
```

## STARTWITH-CANCEL-PREFIX

```text
Given Prefix and cancel before source acquisition
When downstream cancels
Then stop prefix delivery; no source subscription to release
And closed before subscribing to source
```

## STARTWITH-NEXT

```text
Given Active and source connected
When source delivers value after prefix
Then forward source value unchanged
And active
```

## STARTWITH-COMPLETE

```text
Given Active and source completed after prefix
When source completes
Then complete downstream
Then release source
And closed after completion
```

## STARTWITH-ERROR

```text
Given Active and source errored after prefix
When source errors
Then forward exact error
Then release source
And closed after error
```

## STARTWITH-CANCEL-ACTIVE

```text
Given Active and source already subscribed
When downstream cancels
Then release source without completion
And closed by cancellation
```
