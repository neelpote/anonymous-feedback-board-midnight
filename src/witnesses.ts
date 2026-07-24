import { Ledger } from "../contracts/managed/feedback/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type FeedbackPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createFeedbackPrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, FeedbackPrivateState>): [
    FeedbackPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
};
