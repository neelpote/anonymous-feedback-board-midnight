import { describe, expect, it } from 'vitest';
import { verifyFeedbackDeployment, validateFeedbackDeploymentRuntime } from '../runtimeConfig';

const deployment = {
  contractName: 'feedback',
  contractAddress: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  network: 'preview',
  transactionHash: '000000000000000000000000000000000000000000000000000000000000000000',
  deployedAt: '2026-08-03T18:00:00.000Z',
};

describe('Anonymous Feedback Board production configuration', () => {
  it('accepts matching Preview deployment evidence', () => {
    expect(verifyFeedbackDeployment(deployment).contractName).toBe('feedback');
  });

  it('rejects evidence copied from another project', () => {
    expect(() => verifyFeedbackDeployment({ ...deployment, contractName: 'foreign_contract' })).toThrow(/different contract/);
  });

  it('rejects malformed contract and transaction identifiers', () => {
    expect(() => verifyFeedbackDeployment({ ...deployment, contractAddress: 'preview1bad' })).toThrow(/32-byte/);
    expect(() => verifyFeedbackDeployment({ ...deployment, transactionHash: 'pending' })).toThrow(/transaction evidence/);
  });

  it('prevents demo mode and network drift in production', () => {
    expect(() => validateFeedbackDeploymentRuntime({ networkId: 'preprod' })).toThrow(/Preview/);
    expect(() => validateFeedbackDeploymentRuntime({ production: true, demoMode: 'true' })).toThrow(/forbidden/);
  });
});

