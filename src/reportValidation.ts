export const reportByteLength = (message: string) => new TextEncoder().encode(message).length;

export function encodeReport(message: string): Uint8Array {
  if (!message.trim()) throw new Error('Enter a report before submitting.');
  const bytes = new TextEncoder().encode(message);
  if (bytes.length > 32) throw new Error('Reports must be 32 UTF-8 bytes or fewer. Nothing was submitted.');
  return bytes;
}
