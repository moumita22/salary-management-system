import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.js';
import ProtectedRoute from '../components/ProtectedRoute.js';

describe('ProtectedRoute Guard & Edge Cases', () => {
  it('should redirect unauthenticated users to /login when no token is present', () => {
    localStorage.clear();

    render(
      <MemoryRouter initialEntries={['/salary_management']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page Screen</div>} />
            <Route
              path="/salary_management"
              element={
                <ProtectedRoute>
                  <div>Secret Salary Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Protected content should NOT be rendered
    expect(screen.queryByText('Secret Salary Content')).not.toBeInTheDocument();
    // Redirect target should be rendered
    expect(screen.getByText('Login Page Screen')).toBeInTheDocument();
  });

  it('should render protected children when user is authenticated with a token', async () => {
    localStorage.setItem('sms_token', 'valid-mock-bearer-token');
    localStorage.setItem('sms_username', 'admin');

    const api = await import('../services/api.js');
    vi.spyOn(api, 'getCurrentUser').mockResolvedValue({
      user: { id: 1, username: 'admin', role: 'ADMIN' },
    });

    render(
      <MemoryRouter initialEntries={['/salary_management']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page Screen</div>} />
            <Route
              path="/salary_management"
              element={
                <ProtectedRoute>
                  <div>Secret Salary Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Secret Salary Content')).toBeInTheDocument();
  });
});
