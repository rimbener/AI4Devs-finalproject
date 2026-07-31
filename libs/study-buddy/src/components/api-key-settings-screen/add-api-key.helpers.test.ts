import type { TextInput } from 'react-native';
import { focusApiKeyField, isSafeExternalUrl } from './add-api-key.helpers';

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

  // Mutation coverage: the pattern's `^` anchor — an https:// scheme appearing anywhere OTHER
  // than the very start (e.g. embedded after an unsafe scheme) must still be rejected.
  it('rejects a url where http(s):// appears later in the string, not at the start', () => {
    expect(isSafeExternalUrl('javascript:alert(1)//https://groq.example')).toBe(false);
  });
});

describe('focusApiKeyField', () => {
  it('focuses the ref when a provider is selected', () => {
    const focus = jest.fn();
    const ref = { current: { focus } as unknown as TextInput };

    focusApiKeyField(ref, 'groq');

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('does not focus when no provider is selected', () => {
    const focus = jest.fn();
    const ref = { current: { focus } as unknown as TextInput };

    focusApiKeyField(ref, null);

    expect(focus).not.toHaveBeenCalled();
  });

  it('does not throw when the ref is not yet attached', () => {
    const ref = { current: null };

    expect(() => focusApiKeyField(ref, 'groq')).not.toThrow();
  });
});
