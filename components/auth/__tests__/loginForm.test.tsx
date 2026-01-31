import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../loginForm';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Mock modules
jest.mock('@/lib/supabase/client');
jest.mock('next/navigation');

describe('LoginForm', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockSignInWithPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    });
  });

  it('renders login form with all required fields', () => {
    render(<LoginForm />);

    expect(screen.getByText(/welcome back!/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account?/i)).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    render(<LoginForm />);

    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('displays validation errors for empty fields', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);

    // HTML5 validation prevents submission
    const emailInput = screen.getByLabelText(/email:/i);
    const passwordInput = screen.getByLabelText(/password:/i);
    
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('updates input values when user types', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email:/i);
    const passwordInput = screen.getByLabelText(/password:/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('shows loading state during submission', async () => {
    mockSignInWithPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email:/i);
    const passwordInput = screen.getByLabelText(/password:/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    fireEvent.click(submitButton);

    expect(screen.getByText(/logging in.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('successfully logs in and redirects to questions page', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email:/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password:/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/questions');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('displays error message on failed login', async () => {
    const errorMessage = 'Invalid email or password';
    mockSignInWithPassword.mockResolvedValue({ 
      error: { message: errorMessage } 
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email:/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password:/i), 'wrongpass');
    
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables inputs during submission', async () => {
    mockSignInWithPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email:/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password:/i), 'password123');
    
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    const emailInput = screen.getByLabelText(/email:/i);
    const passwordInput = screen.getByLabelText(/password:/i);

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });

  it('clears error message on new submission attempt', async () => {
    mockSignInWithPassword
      .mockResolvedValueOnce({ error: { message: 'Error' } })
      .mockResolvedValueOnce({ error: null });

    const user = userEvent.setup();
    render(<LoginForm />);

    // First failed attempt
    await user.type(screen.getByLabelText(/email:/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password:/i), 'wrong');
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    // Second attempt
    await user.clear(screen.getByLabelText(/password:/i));
    await user.type(screen.getByLabelText(/password:/i), 'correct');
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });
  });
});
