import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import { describe,test } from 'node:test';

describe('Login page', () => {
  test('renders sign in with Google button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    screen.getByRole('button', { name: /sign in with google/i });
    // expect(googleButton).toBeInTheDocument();
  });
});
