# mergeWith-unbounded-2: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../generated/mergeWith.scenarios.md) for complete histories and their test witnesses.

## S15-MERGEWITH-INIT

```text
Given Unsubscribed and first consumer connection
When connect result
Then subscribe source 0 first, then every configured other input in argument order
And Active; live inputs are 0 through 2; pending is empty
```

## S15-MERGEWITH-NEXT

```text
Given Active and input resource belongs to the current live-input set
When value from a subscribed source
Then forward the exact input payload once
And Active; the live-input set is unchanged; pending remains empty
```

## S15-MERGEWITH-COMPLETE-WAIT

```text
Given Active and the completing input is live and at least one other input remains live
When one input completed
Then release the completed input; emit no result notification
And Active; remove the completed input from the live-input set; pending remains empty
```

## S15-MERGEWITH-COMPLETE-LAST

```text
Given Active and the completing input is the only live input
When one input completed
Then release the final input and run its registered teardown
Then complete the result
And Closed with reason complete; no owned input subscriptions
```

## S15-MERGEWITH-ERROR

```text
Given Active and the failing input belongs to the live-input set
When one input failed
Then forward the exact error
Then release every live input in subscription order
And Closed with reason input-error; no owned input subscriptions
```

## S15-MERGEWITH-CANCEL

```text
Given Active and the result is Active and the consumer unsubscribes
When consumer unsubscribed
Then release every live input in subscription order; emit no result notification
And Closed with reason cancel; no owned input subscriptions
```
