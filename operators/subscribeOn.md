# subscribeOn: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Defer subscription to the producer using a scheduled action; preserve source notification ordering and cancellation.

**Scope:** One FIFO virtual scheduler with a safe integer 0..8 delay, including deferred delay=0.. Deferred scheduler action (TestScheduler-like) and non-reentrant subsequent source delivery.

**Dataflow shape:** `subscribeOn(scheduler,delay) : Cω(Scheduler,Duration) × T* → T*`. One scheduled subscription action precedes any source acquisition. Cancelling before the scheduler fires prevents producer subscription entirely. Once connected, next/error/complete are not separately scheduled.

<!-- S19-SUBSCRIBEON-SCHEDULE -->
subscribeOn defers producer connection, not each source notification.

<!-- S19-SUBSCRIBEON-CONNECT -->
Scheduler executes acquisition once; the connected source can emit synchronously.

<!-- S19-SUBSCRIBEON-PENDING-CANCEL -->
Early unsubscribe is sufficient to stop pending subscription without ever touching producer.

<!-- S19-SUBSCRIBEON-NEXT -->
subscribeOn changes connection timing, not downstream next delivery timing.

<!-- S19-SUBSCRIBEON-COMPLETE -->
Source completion is not scheduled a second time.

<!-- S19-SUBSCRIBEON-ERROR -->
Errors are not deferred beyond source delivery.

<!-- S19-SUBSCRIBEON-ACTIVE-CANCEL -->
No delayed subscription is retained after cancellation.

**Time:** Scheduler determines connection time. Source itself determines notification times after connection.

**Sharing:** No sharing; each downstream subscription independently schedules its own source acquisition.

**Callbacks:** The scheduler executes a source-subscription thunk; no user projection callback.

**Excluded:** queueScheduler synchronous zero-delay execution, arbitrary scheduler implementations/throws. Actual wall-clock drift, source delivery during the atomic scheduling reaction, reentrant observers.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-19.md) is reported separately from this specification.
