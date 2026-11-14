# repeat: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Repeat source after successful completion up to a total source-subscription count.

**Scope:** Finite safe-integer bound in 0..8. Total subscriptions including the initial one.. Nonreentrant, post-setup notifications; only bounded finite runs.

**Dataflow shape:** `repeat(count) : Cω(count) -> T* -> T*`. count=0 produces no source subscription and only successful empty completion. Each source success except the final causes a fresh source subscription. An error terminates the result; values across all completed attempts remain delivered.

<!-- S17-REPEAT-START -->
The output subscribes to the producer lazily; a fresh source execution begins.

<!-- S17-REPEAT-NEXT -->
Every source value is delivered even when later source completion/error causes another subscription.

<!-- S17-REPEAT-RESTART -->
A successful completion triggers a new source subscription until the total subscription count is reached.

<!-- S17-REPEAT-FINAL-COMPLETE -->
The count is total subscriptions, not additional resubscriptions.

<!-- S17-REPEAT-ERROR -->
Repeat never retries failures. Error ends the entire result at once.

<!-- S17-REPEAT-CANCEL -->
Cancellation ends the current attempt and prevents later restarts; no result completion is synthesized.

**Time:** Resubscription is immediate following source terminal delivery. Time of later notifications belongs to each new producer.

**Sharing:** None: each result subscription independently executes and restarts source.

**Callbacks:** No notifier callback or delay selector in this profile.

**Excluded:** Unbounded (Infinity), fractional/negative counts, numeric or notifier-function delays and scheduler-driven resubscription. Synchronous terminal notifications during subscription setup, reentrant observers and teardown exceptions.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-17.md) is reported separately from this specification.
