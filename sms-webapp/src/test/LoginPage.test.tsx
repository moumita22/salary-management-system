import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.js';
import LoginPage from '../pages/LoginPage.js';

function renderLoginPage() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('LoginPage Component & Edge Cases', () => {
  it('should render Sign In tab by default with password hidden', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /ACME Corporation/i })).toBeInTheDocument();
    expect(screen.getByTestId('signin-tab')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should toggle password visibility when clicking the eye button', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByLabelText(/Show password/i);
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideButton = screen.getByLabelText(/Hide password/i);
    await user.click(hideButton);

    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should populate admin credentials when clicking demo quick-fill', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    const quickFillBtn = screen.getByText('Click to Auto-fill');
    await user.click(quickFillBtn);

    const usernameInput = screen.getByPlaceholderText(/Enter your username/i);
    expect(usernameInput).toHaveValue('admin');

    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    expect(passwordInput).toHaveValue('adminpassword');
  });

  it('should switch to Create Account tab and reveal Full Name and Confirm Password fields', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    const createTab = screen.getByTestId('signup-tab');
    await user.click(createTab);

    expect(screen.getByPlaceholderText(/e\.g\. Production Administrator/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account & Sign In/i })).toBeInTheDocument();

    // Confirm password input exists in sign up mode
    const inputs = screen.getAllByPlaceholderText('••••••••••••');
    expect(inputs.length).toBe(2);
  });

  it('should show error when passwords do not match during sign up', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    // Switch to Sign Up
    await user.click(screen.getByTestId('signup-tab'));

    const usernameInput = screen.getByPlaceholderText(/Choose a unique username/i);
    await user.type(usernameInput, 'newadmin');

    const passwordInputs = screen.getAllByPlaceholderText('••••••••••••');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'mismatch456');

    const submitBtn = screen.getByRole('button', { name: /Create Account & Sign In/i });
    fireEvent.submit(submitBtn.closest('form')!);

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it('should reject sign up when password is less than 6 characters', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    await user.click(screen.getByTestId('signup-tab'));

    const usernameInput = screen.getByPlaceholderText(/Choose a unique username/i);
    await user.type(usernameInput, 'shortuser');

    const passwordInputs = screen.getAllByPlaceholderText('••••••••••••');
    await user.type(passwordInputs[0], '123');
    await user.type(passwordInputs[1], '123');

    const submitBtn = screen.getByRole('button', { name: /Create Account & Sign In/i });
    fireEvent.submit(submitBtn.closest('form')!);

    expect(await screen.findByText(/Password must be at least 6 characters long/i)).toBeInTheDocument();
  });

  it('should clear confirm password when switching back from Create Account to Sign In', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    // Switch to Sign Up
    await user.click(screen.getByTestId('signup-tab'));
    const passwordInputs = screen.getAllByPlaceholderText('••••••••••••');
    await user.type(passwordInputs[1], 'someconfirmpass');

    // Switch back to Sign In
    await user.click(screen.getByTestId('signin-tab'));

    // Confirm password should no longer be rendered
    expect(screen.queryByText(/Confirm Password/i)).not.toBeInTheDocument();
  });
});
