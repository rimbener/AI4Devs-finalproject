import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { render, renderHook, screen } from '@testing-library/react-native';
import { createElement } from 'react';
import { Text } from 'react-native';

import { QueryProvider } from './query-provider';

describe('QueryProvider', () => {
  it('renders its children', () => {
    render(createElement(QueryProvider, null, createElement(Text, null, 'hello')));

    expect(screen.getByText('hello')).toBeTruthy();
  });

  it('provides a real QueryClient instance to descendants', () => {
    const { result } = renderHook(() => useQueryClient(), { wrapper: QueryProvider });

    expect(result.current).toBeInstanceOf(QueryClient);
  });

  // Mutation-kill — the client must come from a lazy useState initializer, not `new
  // QueryClient()` evaluated on every render; otherwise descendants would lose query cache/state
  // on every re-render.
  it('keeps the same QueryClient instance across re-renders', () => {
    const { result, rerender } = renderHook(() => useQueryClient(), { wrapper: QueryProvider });

    const firstClient = result.current;
    rerender(undefined);

    expect(result.current).toBe(firstClient);
  });
});
