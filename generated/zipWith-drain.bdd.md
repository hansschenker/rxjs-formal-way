# zipWith-3-fifo-8: Rule BDD

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restricted project profile: And denotes next state, not general Gherkin conjunction.

These are guarded transition rules, not end-to-end executions. Read the [concrete Scenario BDD](../docs/SESSION-23-ZIP-WITH.md) for complete histories and their test witnesses.

## S23-ZIPWITH-START

```text
Given Unsubscribed and no connection yet
When First connection to the result.
Then acquire source input zero, then each auxiliary in argument order
And Every FIFO is empty, every input is live, and received/emitted counts are zero.
```

## S23-ZIPWITH-BUFFER

```text
Given Active and addressed input live; within FIFO/count scope; another FIFO remains empty
When Opaque value from an indexed live input; input zero is upstream source.
Then append the opaque value to its input FIFO; emit nothing
And Only that FIFO and its received count change.
```

## S23-ZIPWITH-EMIT

```text
Given Active and addressed input live; every FIFO becomes nonempty; no completed FIFO is exhausted
When Opaque value from an indexed live input; input zero is upstream source.
Then append input value
Then remove one oldest value from every FIFO
Then emit one fresh tuple in input order
And Received count advances for arriving input; emitted count advances once; unmatched values remain queued.
```

## S23-ZIPWITH-EMIT-LAST

```text
Given Active and addressed input live; tuple ready; removing it exhausts a previously completed FIFO
When Opaque value from an indexed live input; input zero is upstream source.
Then emit one final tuple in input order
Then complete downstream
Then release remaining live inputs in subscription order
And Closed and all queued values released.
```

## S23-ZIPWITH-COMPLETE-BUFFERED

```text
Given Active and addressed input live and its FIFO is nonempty
When Indexed input completes; its queued values may remain usable.
Then release this completed input connection only
And Input becomes non-live; its FIFO remains available for later tuples.
```

## S23-ZIPWITH-COMPLETE-EMPTY

```text
Given Active and addressed input live and its FIFO is empty
When Indexed input completes; its queued values may remain usable.
Then complete downstream
Then release all remaining live inputs in subscription order
And Closed; unmatched values in other FIFOs are discarded.
```

## S23-ZIPWITH-ERROR

```text
Given Active and addressed input live
When Indexed input fails with an opaque error.
Then error downstream with the same opaque payload
Then release every remaining live input in subscription order
And Closed; queued values are discarded without a final tuple.
```

## S23-ZIPWITH-CANCEL

```text
Given Active and result connection remains active
When Close the result connection silently.
Then release remaining live input connections without a notification
And Closed; queued values are released.
```
