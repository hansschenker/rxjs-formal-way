# sequenceEqual: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Compare two Observable value sequences in arrival-independent FIFO order with strict default equality.

**Scope:** Two nonreentrant Observable sources and default strict === comparator, unmatched FIFO length up to 32.. Source-first atomic setup and post-subscription external notifications only.

**Dataflow shape:** `sequenceEqual(compareTo, ===) : Cω(Comparison) → T* → Bool?`. Exactly one boolean next followed by complete when unequal pair or unequal length is proven, or both complete equally. Both completed and both unmatched FIFO buffers empty implies true, including two empty sources. A nonterminating source can prevent any output. Errors forward without a boolean.

<!-- S18-SEQUENCEEQUAL-START -->
Both streams are subscribed for one independent comparison; each has a FIFO queue and completion bit.

<!-- S18-SEQUENCEEQUAL-LEFT-QUEUE -->
No output until an opposite value arrives, or comparison becomes decided. Values remain opaque.

<!-- S18-SEQUENCEEQUAL-LEFT-EXTRA -->
A new value after an exhausted, completed opposite stream proves unequal lengths.

<!-- S18-SEQUENCEEQUAL-LEFT-MATCH -->
Default comparator is strict JavaScript ===, including NaN mismatch and object identity.

<!-- S18-SEQUENCEEQUAL-LEFT-DIFFER -->
One unequal aligned pair is sufficient: no need to wait for either source to finish.

<!-- S18-SEQUENCEEQUAL-LEFT-FIRST-COMPLETE -->
Completion alone is insufficient while the opposite source might still produce matching values.

<!-- S18-SEQUENCEEQUAL-LEFT-FINAL-EQUAL -->
Only both completed streams with no unmatched FIFO values are equal.

<!-- S18-SEQUENCEEQUAL-LEFT-FINAL-UNEVEN -->
Only both completed streams with no unmatched FIFO values are equal.

<!-- S18-SEQUENCEEQUAL-LEFT-ERROR -->
An error is a terminal failure, never converted to a false equality result.

<!-- S18-SEQUENCEEQUAL-RIGHT-QUEUE -->
No output until an opposite value arrives, or comparison becomes decided. Values remain opaque.

<!-- S18-SEQUENCEEQUAL-RIGHT-EXTRA -->
A new value after an exhausted, completed opposite stream proves unequal lengths.

<!-- S18-SEQUENCEEQUAL-RIGHT-MATCH -->
Default comparator is strict JavaScript ===, including NaN mismatch and object identity.

<!-- S18-SEQUENCEEQUAL-RIGHT-DIFFER -->
One unequal aligned pair is sufficient: no need to wait for either source to finish.

<!-- S18-SEQUENCEEQUAL-RIGHT-FIRST-COMPLETE -->
Completion alone is insufficient while the opposite source might still produce matching values.

<!-- S18-SEQUENCEEQUAL-RIGHT-FINAL-EQUAL -->
Only both completed streams with no unmatched FIFO values are equal.

<!-- S18-SEQUENCEEQUAL-RIGHT-FINAL-UNEVEN -->
Only both completed streams with no unmatched FIFO values are equal.

<!-- S18-SEQUENCEEQUAL-RIGHT-ERROR -->
An error is a terminal failure, never converted to a false equality result.

<!-- S18-SEQUENCEEQUAL-CANCEL -->
Cancellation is not inequality. Pending buffers are discarded without output.

**Time:** No new time source: arrival order determines FIFO alignment, equal-time notifications use caller order.

**Sharing:** None; every downstream subscription performs its own independent comparison.

**Callbacks:** Default comparator === computed purely. Custom user comparators and their throws require a separate callback-invocation model.

**Excluded:** Custom comparator callbacks, errors thrown by comparators, and arbitrary ObservableInput conversion. Buffer overflow beyond the declared maximum, synchronous subscription-time source notifications and reentrant observers. Infinite traces do not establish liveness; nonterminating or silent sources may leave comparison unresolved.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-18.md) is reported separately from this specification.
