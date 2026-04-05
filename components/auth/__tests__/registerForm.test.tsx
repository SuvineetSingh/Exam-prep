import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm as SignupForm } from '../registerForm';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Mock modules
jest.mock('@/lib/supabase/client');
jest.mock('next/navigation');

describe('SignupForm', () => {
  const mockPush = jest.fn();
  const mockSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: jest.fn().mockResolvedValue({ error: null }),
      },
    });

  });

  it('renders registration form with all fields', () => {
    render(<SignupForm />);

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    render(<SignupForm />);

    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('updates input values when user types', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);

    await user.type(usernameInput, 'testuser');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'StrongPass@123');
    await user.type(confirmInput, 'StrongPass@123');

    expect(usernameInput).toHaveValue('testuser');
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('StrongPass@123');
    expect(confirmInput).toHaveValue('StrongPass@123');
  });

  it('validates password match', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass@123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates password complexity (Regex/zxcvbn)', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    // Using a weak password that fails your component's regex/strength check
    await user.type(screen.getByLabelText(/^password$/i), '123');
    await user.type(screen.getByLabelText(/confirm password/i), '123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/password needs 8\+ characters/i)).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('successfully registers user and shows success popup', async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass@123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass@123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'StrongPass@123',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username: 'testuser' },
        },
      });
      // Check for your custom success modal text instead of window.alert
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });
  });

  it('displays error message on failed registration from Supabase', async () => {
    const errorMessage = 'Email already exists';
    mockSignUp.mockResolvedValue({ error: { message: errorMessage } });

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass@123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass@123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass@123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass@123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/registering\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registering\.\.\./i })).toBeDisabled();
  });

  it('disables inputs during submission', async () => {
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass@123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass@123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByRole('button', { name: /registering\.\.\./i })).toBeDisabled();
  });
});