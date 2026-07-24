import { FeedbackSimulator } from "./feedback-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";

setNetworkId("undeployed");

describe("Anonymous Feedback & Whistleblowing Smart Contract Tests", () => {
  const adminSecret = randomBytes(32);
  const surveyId = randomBytes(32);

  // Setup helper to create a simulator
  const setupSimulator = (userSecret: Uint8Array) => {
    const tempSim = new FeedbackSimulator(adminSecret, surveyId, new Uint8Array(32));
    const adminPk = tempSim.publicKey(adminSecret);
    return new FeedbackSimulator(userSecret, surveyId, adminPk);
  };

  it("1. Properly initializes survey campaign parameters and admin PK", () => {
    const userSecret = randomBytes(32);
    const simulator = setupSimulator(userSecret);
    const ledgerState = simulator.getLedger();

    expect(ledgerState.survey_id).toEqual(surveyId);
    expect(ledgerState.response_count).toEqual(0n);
  });

  it("2. Lets admin whitelist participants", () => {
    const userSecret = randomBytes(32);
    const simulator = setupSimulator(userSecret);
    const participantPk = randomBytes(32);

    // Switch to admin to whitelist
    simulator.switchUser(adminSecret);
    const ledgerState = simulator.registerParticipant(participantPk);
    expect(ledgerState.whitelisted_participants.member(participantPk)).toEqual(true);
  });

  it("3. Allows a whitelisted participant to submit feedback anonymously", () => {
    const userSecret = randomBytes(32);
    const simulator = setupSimulator(userSecret);
    const userPk = simulator.publicKey(userSecret);

    // Whitelist
    simulator.switchUser(adminSecret);
    simulator.registerParticipant(userPk);

    // Submit feedback
    simulator.switchUser(userSecret);
    const feedback = "The internal processes can be optimized by migrating to a private blockchain.";
    const ledgerState = simulator.submitFeedback(feedback);

    expect(ledgerState.response_count).toEqual(1n);
    expect(ledgerState.responses.lookup(0n)).toEqual(feedback);
  });

  it("4. Throws when an unregistered participant tries to submit feedback", () => {
    const userSecret = randomBytes(32);
    const simulator = setupSimulator(userSecret);

    // Attempt to submit feedback without being whitelisted
    expect(() => simulator.submitFeedback("Hello world")).toThrow("failed assert: Participant is not whitelisted");
  });

  it("5. Throws when a participant tries to submit feedback twice", () => {
    const userSecret = randomBytes(32);
    const simulator = setupSimulator(userSecret);
    const userPk = simulator.publicKey(userSecret);

    // Whitelist
    simulator.switchUser(adminSecret);
    simulator.registerParticipant(userPk);

    // Submit once
    simulator.switchUser(userSecret);
    simulator.submitFeedback("First report");

    // Submit twice
    expect(() => simulator.submitFeedback("Second report")).toThrow("failed assert: Participant has already submitted feedback");
  });
});
