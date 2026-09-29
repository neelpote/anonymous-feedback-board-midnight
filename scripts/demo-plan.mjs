export const contractName = 'feedback';
export const target = 50;
const bytes = value => Uint8Array.from(Buffer.from(value, 'hex'));
const padded = value => { const result = new Uint8Array(32); result.set(new TextEncoder().encode(value)); return result; };
export function makePlan(pure, data) {
  const admin = bytes(data.adminSecret);
  const adminPk = pure.publicKey(admin);
  const id = bytes(data.id);
  const actors = data.actors.map((actor, index) => ({ secretKey: bytes(actor.secret), salt: bytes(actor.salt), index }));
  const steps = [];
  const add = (kind, circuit, state, args, verify) => steps.push({kind, circuit, state, args, verify});
  const adminState = { secretKey: admin };
  for (const actor of actors.slice(0, target)) {
    const pk = pure.publicKey(actor.secretKey);
    const nullifier = pure.computeNullifier(actor.secretKey, id);
    add('setup', 'registerParticipant', adminState, [pk], live => live.whitelisted_participants.member(pk));
    add('demo', 'submitFeedback', { secretKey: actor.secretKey }, [`Demo feedback ${actor.index + 1}: navigation and form submission reviewed.`], live => live.nullifiers.member(nullifier));
  }
  return { constructorArgs: [id, adminPk], adminState, steps };
}
export const witnessFields = ["localSecretKey"];
