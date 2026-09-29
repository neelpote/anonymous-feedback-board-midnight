import { expect, it } from 'vitest';
import { encodeReport, reportByteLength } from '../reportValidation';

it('rejects empty reports', () => {
  for (const value of ['', '   ', '\n']) expect(() => encodeReport(value)).toThrow(/Enter a report/);
});
it('accepts exactly 32 bytes without altering the report', () => {
  const value = 'a'.repeat(32);
  expect(new TextDecoder().decode(encodeReport(value))).toBe(value);
});
it('rejects oversized reports rather than truncating', () => {
  expect(() => encodeReport('a'.repeat(33))).toThrow(/32 UTF-8 bytes/);
});
it('counts multibyte characters using UTF-8', () => {
  expect(reportByteLength('🔒')).toBe(4);
  expect(encodeReport('🔒'.repeat(8)).length).toBe(32);
  expect(() => encodeReport('🔒'.repeat(9))).toThrow();
  expect(reportByteLength('é')).toBe(2);
});
