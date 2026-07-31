import { isSafeExternalUrl } from './add-api-key.helpers';

describe('isSafeExternalUrl', () => {
  it('accepts an https:// url', () => {
    expect(isSafeExternalUrl('https://groq.example/docs')).toBe(true);
  });

  it('accepts an http:// url', () => {
    expect(isSafeExternalUrl('http://groq.example/docs')).toBe(true);
  });

  it('accepts an uppercase scheme', () => {
    expect(isSafeExternalUrl('HTTPS://groq.example')).toBe(true);
  });

  it('rejects a javascript: scheme', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects a data: scheme', () => {
    expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects a scheme-relative or protocol-less string', () => {
    expect(isSafeExternalUrl('groq.example/docs')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isSafeExternalUrl('')).toBe(false);
  });
});
