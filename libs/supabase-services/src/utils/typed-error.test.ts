import { toTypedError } from './typed-error';

describe('toTypedError', () => {
  it('builds an Error with the given message', () => {
    const error = toTypedError('validation_error', 'invalid input');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('invalid input');
  });

  it('attaches the given code to the error', () => {
    const error = toTypedError('validation_error', 'invalid input');

    expect(error.code).toBe('validation_error');
  });

  it('narrows the code to the literal passed in, not a shared union default', () => {
    const error = toTypedError('not_found', 'missing');

    expect(error.code).toBe('not_found');
  });
});
