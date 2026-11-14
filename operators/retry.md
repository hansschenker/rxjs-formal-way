# retry: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Retry failed source subscriptions up to a bounded additional-attempt budget.

**Scope:** Finite safe-integer bound in 0..8. Both resetOnSuccess=false/true are modeled.. Nonreentrant, post-setup notifications; only bounded finite runs.

**Dataflow shape:** `retry(count,resetOnSuccess) : Cω(count,reset) -> T* -> T*`. A source error is retried at most count times in addition to the first attempt. All next values across failed and successful attempts are retained in delivery order. resetOnSuccess clears the retry counter after a next value, not the total attempt count.

<!-- S17-RETRY-START -->
The output subscribes to the producer lazily; a fresh source execution begins.

<!-- S17-RETRY-NEXT -->
Every source value is delivered even when later source completion/error causes another subscription.

<!-- S17-RETRY-COMPLETE -->
Retry responds to errors, not successful completion.

<!-- S17-RETRY-RETRY -->
A source failure is suppressed while the configured retry budget remains; the old subscription is disposed before the next.

<!-- S17-RETRY-RETRY-EXHAUSTED -->
Count is the maximum number of retry attempts after the first subscription. The final error is not converted to complete.

<!-- S17-RETRY-CANCEL -->
Cancellation ends the current attempt and prevents later restarts; no result completion is synthesized.

**Time:** Resubscription is immediate following source terminal delivery. Time of later notifications belongs to each new producer.

**Sharing:** None: each result subscription independently executes and restarts source.

**Callbacks:** No notifier callback or delay selector in this profile.

**Excluded:** Unbounded (Infinity), fractional/negative counts, numeric or notifier-function delays and scheduler-driven resubscription. Synchronous terminal notifications during subscription setup, reentrant observers and teardown exceptions.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-17.md) is reported separately from this specification.
