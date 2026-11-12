# observeOn: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Reschedule all source notifications, including completion and errors, with independently owned scheduler tasks.

**Scope:** Virtual FIFO scheduler supplied externally; nonnegative safe integer delay 2.. Atomic nonreentrant delivery. Scheduler callbacks do not reenter current transitions.

**Dataflow shape:** `observeOn : T* → T* (notification-time shifted)`. Every source next becomes exactly one scheduled next unless cancelled first. Source complete and source error are both scheduled notifications, never immediate result signals. FIFO scheduler tie order preserves input order at equal deadlines; consumer cancellation releases every queued action.

<!-- S15-OBSERVEON-INIT -->
The source is acquired only when a consumer subscribes.

<!-- S15-OBSERVEON-QUEUE-NEXT -->
No immediate downstream next; each source emission owns an independent scheduler action.

<!-- S15-OBSERVEON-QUEUE-COMPLETE -->
Completion is also scheduled, unlike delay. A source completion does not immediately terminate the result.

<!-- S15-OBSERVEON-QUEUE-ERROR -->
Errors are scheduled rather than immediately forwarded; previously queued notifications retain FIFO priority.

<!-- S15-OBSERVEON-FIRE-NEXT -->
Delivery occurs at the scheduler-supplied fire event, not the original source event.

<!-- S15-OBSERVEON-FIRE-COMPLETE -->
The result completes only when the scheduled completion action fires.

<!-- S15-OBSERVEON-FIRE-ERROR -->
The error object is unchanged but its delivery is rescheduled.

<!-- S15-OBSERVEON-CANCEL -->
Consumer cancellation is immediate and silent; it does not force queued work.

**Time:** Source arrival and scheduler.fire times are inputs. Due time is arrival+delay, and only a legal head-of-queue timer can fire.

**Sharing:** None; each consumer gets fresh source and scheduled-action subscriptions.

**Callbacks:** No user projection callbacks; opaque source values and error identities remain unchanged.

**Excluded:** Custom or non-FIFO schedulers; negative/nonintegral/overflow delay, synchronous recursive SchedulerActions. Downstream observer reentrancy and throwing teardown; source acquisition may not synchronously deliver reentrant events.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-15.md) is reported separately from this specification.
