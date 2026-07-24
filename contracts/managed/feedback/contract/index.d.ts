import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerParticipant(context: __compactRuntime.CircuitContext<PS>,
                      participant_pk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitFeedback(context: __compactRuntime.CircuitContext<PS>,
                 feedback_text_0: string): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerParticipant(context: __compactRuntime.CircuitContext<PS>,
                      participant_pk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitFeedback(context: __compactRuntime.CircuitContext<PS>,
                 feedback_text_0: string): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  publicKey(sk_0: Uint8Array): Uint8Array;
  computeNullifier(sk_0: Uint8Array, id_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  registerParticipant(context: __compactRuntime.CircuitContext<PS>,
                      participant_pk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitFeedback(context: __compactRuntime.CircuitContext<PS>,
                 feedback_text_0: string): __compactRuntime.CircuitResults<PS, []>;
  publicKey(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  computeNullifier(context: __compactRuntime.CircuitContext<PS>,
                   sk_0: Uint8Array,
                   id_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly survey_id: Uint8Array;
  whitelisted_participants: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  responses: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): string;
    [Symbol.iterator](): Iterator<[bigint, string]>
  };
  readonly response_count: bigint;
  readonly admin: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               id_0: Uint8Array,
               admin_pk_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
