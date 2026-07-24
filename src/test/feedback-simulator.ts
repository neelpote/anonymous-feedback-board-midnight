import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../../contracts/managed/feedback/contract/index.js";
import { type FeedbackPrivateState, witnesses } from "../witnesses.js";

export class FeedbackSimulator {
  readonly contract: Contract<FeedbackPrivateState>;
  circuitContext: CircuitContext<FeedbackPrivateState>;

  constructor(secretKey: Uint8Array, id: Uint8Array, adminPk: Uint8Array) {
    this.contract = new Contract<FeedbackPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext({ secretKey }, "0".repeat(64)),
      id,
      adminPk
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  public switchUser(secretKey: Uint8Array) {
    this.circuitContext.currentPrivateState = {
      secretKey,
    };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): FeedbackPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public registerParticipant(participantPk: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.registerParticipant(
      this.circuitContext,
      participantPk,
    ).context;
    return this.getLedger();
  }

  public submitFeedback(feedbackText: string): Ledger {
    this.circuitContext = this.contract.impureCircuits.submitFeedback(
      this.circuitContext,
      feedbackText,
    ).context;
    return this.getLedger();
  }

  public publicKey(sk: Uint8Array): Uint8Array {
    return this.contract.circuits.publicKey(
      this.circuitContext,
      sk,
    ).result;
  }
}
