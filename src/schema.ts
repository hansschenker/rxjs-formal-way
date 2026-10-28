/** Canonical executable specification. No subscriptions, clocks or effects run here. */
export type Notification<T> =
  | Readonly<{ kind: 'N'; value: T }>
  | Readonly<{ kind: 'E'; error: unknown }>
  | Readonly<{ kind: 'C' }>;

/** Generation is local to a trace's executionId, not a globally unique identifier. */
export type ResourceRef = Readonly<{ id: string; generation: number }>;
/** A callback request is data. Its resource generation identifies one invocation, not a subscription. */
export type CallbackInvocation<T> = Readonly<{
  type: 'invoke-callback'; resource: ResourceRef; value: T; index: number;
}>;
export type Action<T, Input = unknown> =
  | Readonly<{ type: 'notify'; target: string; notification: Notification<T> }>
  | Readonly<{ type: 'subscribe' | 'unsubscribe'; resource: ResourceRef }>
  | Readonly<{ type: 'schedule'; resource: ResourceRef; delay: number }>
  | Readonly<{ type: 'cancel-timer'; resource: ResourceRef }>
  | CallbackInvocation<Input>;

export type Event = Readonly<{ type: string }>;
export type Control = Readonly<{ id: string; description: string; terminal: boolean }>;
export type InputDescriptor = Readonly<{
  type: string;
  origin: 'downstream' | 'source' | 'outer' | 'inner' | 'timer' | 'callback' | 'environment';
  category: 'notification' | 'lifecycle' | 'time' | 'callback';
  description: string;
}>;
export type SourceReference = Readonly<{ url: string; revision: string; purpose: string }>;
export type ModelMetadata = Readonly<{
  schemaVersion: '1.0' | '1.1';
  id: string;
  operator: string;
  rxjsVersion: string;
  purpose: string;
  cardinality: Readonly<{ signature: string; conditions: readonly string[] }>;
  scope: Readonly<{
    parameters: string;
    callbacks: string;
    time: string;
    reentrancy: string;
    exclusions: readonly string[];
  }>;
  initialization: Readonly<{ control: string; event: string; sourceSubscription: string }>;
  ownership: Readonly<{
    state: 'subscription-local' | 'connection-generation' | 'external-instance';
    sharing: string;
    reset: string;
    resources: readonly Readonly<{ id: string; kind: 'subscription' | 'timer' | 'callback'; owner: string }>[];
  }>;
  dispatch: Readonly<{
    policy: 'atomic-non-reentrant' | 'immediate-reentrant' | 'fifo' | 'scheduled';
    actionSemantics: string;
    cancellationCheckpoints: readonly string[];
  }>;
  inputs: readonly InputDescriptor[];
  actionTypes: readonly Action<unknown>['type'][];
  controls: readonly Control[];
  sources: readonly SourceReference[];
  evidence: Readonly<{
    modelTests: readonly string[];
    runtimeTests: readonly string[];
    status: 'specified' | 'source-inspected' | 'runtime-checked';
    record: string;
  }>;
}>;

export type RuleDescription = Readonly<{
  id: string;
  from: string;
  event: string;
  guard: string;
  to: string;
  actions: readonly string[];
  nextState: string;
  obligations: readonly string[];
  explanation: string;
}>;
export type Reaction<S, A> = Readonly<{ state: S; actions: readonly A[] }>;
export type Rule<P, S, E extends Event, A> = Readonly<{
  description: RuleDescription;
  /** Guards must be pure. The runner checks all candidates, never first-match wins. */
  enabled: (state: S, event: E, parameters: P) => boolean;
  react: (state: S, event: E, parameters: P) => Reaction<S, A>;
}>;
export type OperatorModel<P, S, E extends Event, A> = Readonly<{
  metadata: ModelMetadata;
  parameters: P;
  initialState: () => S;
  control: (state: S) => string;
  validateState: (state: S, parameters: P) => readonly string[];
  validateReaction: (before: S, event: E, result: Reaction<S, A>, parameters: P) => readonly string[];
  rules: readonly Rule<P, S, E, A>[];
}>;

export type TimedEvent<E> = Readonly<{ time: number; event: E }>;
export type TraceStep<S, E, A> = Readonly<{
  sequence: number;
  time: number;
  modelId: string;
  executionId: string;
  ruleId: string;
  event: E;
  before: S;
  after: S;
  actions: readonly A[];
}>;
export type Trace<S, E, A> = Readonly<{
  status: 'finished-input' | 'budget-exhausted';
  consumed: number;
  state: S;
  steps: readonly TraceStep<S, E, A>[];
}>;
/** Descriptive JSON projection: no function bodies and no arbitrary-code loader. */
export type OperatorManifest<P> = Readonly<{
  metadata: ModelMetadata;
  parameters: P;
  rules: readonly RuleDescription[];
}>;
