# retryWhen: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use source errors as control signals for one persistent notifier that governs fresh source subscriptions.

**Scope:** One persistent notifier Observable constructed once at the first source error; no delay selector.. Post-setup source notifications; notifier next admitted only while waiting after a source error.

**Dataflow shape:** `retryWhen(errors$ → notifier$) : Cω(Signal) → T* → T*`. Each successful source next is forwarded; source errors are sent to errorsSubject and not downstream. A notifier next while waiting subscribes another source generation; repeated errors reuse the same notifier. A source completion or notifier completion ends successfully. Notifier error ends with that exact error.

<!-- S18-RETRYWHEN-START -->
The notifier selector and errors Subject are created lazily on the first source error.

<!-- S18-RETRYWHEN-FORWARD -->
Successful source values pass immediately, even if that source errors later and is retried.

<!-- S18-RETRYWHEN-FIRST-ERROR -->
On the first source failure, allocate one Subject, call the notifier selector once, and publish the error to it.

<!-- S18-RETRYWHEN-LATER-ERROR -->
Subsequent retries reuse the same notifier subscription and Subject, without invoking the selector again.

<!-- S18-RETRYWHEN-RETRY -->
The notifier next is a control signal, not an output value; it triggers a new source execution.

<!-- S18-RETRYWHEN-NOTIFIER-COMPLETE-ACTIVE -->
Unlike repeatWhen, a retryWhen notifier completion terminates the result immediately, even during an active retried source.

<!-- S18-RETRYWHEN-NOTIFIER-ERROR-ACTIVE -->
Notifier errors terminate instead of retrying. No original source error is substituted.

<!-- S18-RETRYWHEN-CANCEL-ACTIVE -->
Cancellation is silent and prevents all subsequent resubscriptions.

<!-- S18-RETRYWHEN-NOTIFIER-COMPLETE-WAITING -->
Unlike repeatWhen, a retryWhen notifier completion terminates the result immediately, even during an active retried source.

<!-- S18-RETRYWHEN-NOTIFIER-ERROR-WAITING -->
Notifier errors terminate instead of retrying. No original source error is substituted.

<!-- S18-RETRYWHEN-CANCEL-WAITING -->
Cancellation is silent and prevents all subsequent resubscriptions.

<!-- S18-RETRYWHEN-SOURCE-COMPLETE -->
A successful source completion terminates retryWhen immediately, without waiting for the notifier.

**Time:** Retry only when notifier next arrives; no clock belongs to this operator.

**Sharing:** Internal errors Subject is shared with exactly one notifier subscription per result execution.

**Callbacks:** Notifier selector is modeled by a successful externally supplied Observable; selector throws and invalid inputs excluded.

**Excluded:** Synchronous notifier next during original subscription or errorsSubject.next and the special syncResub recursion. Notifier next while a retried source is still active, which can cause overlapping subscriptions. Promises/async iterable notifier conversions, callback throws, teardown throws and reentrant observers.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-18.md) is reported separately from this specification.
