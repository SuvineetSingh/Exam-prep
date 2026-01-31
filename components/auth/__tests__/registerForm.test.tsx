import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../registerForm';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

jest.mock('@/lib/supabase/client');
jest.mock('next/navigation');

describe('RegisterForm', () => {
  const mockPush = jest.fn();
  const mockSignUp = jest.fn();
  const mockAlert = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = mockAlert;
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
      },
    });
  });

  it('renders registration form with all fields', () => {
    render(<RegisterForm />);

    expect(screen.getByText(/register for an account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    render(<RegisterForm />);

    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('updates input values when user types', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    expect(screen.getByLabelText(/username/i)).toHaveValue('testuser');
    expect(screen.getByLabelText(/^email$/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('password123');
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue('password123');
  });

  it('validates password match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates minimum password length', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'short');
    await user.type(screen.getByLabelText(/confirm password/i), 'short');

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('successfully registers user and redirects to login', async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            username: 'testuser',
          },
        },
      });
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('check your email')
      );
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('displays error message on failed registration', async () => {
    const errorMessage = 'Email already exists';
    mockSignUp.mockResolvedValue({ error: { message: errorMessage } });

    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/^email$/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByText(/registering.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registering.../i })).toBeDisabled();
  });

  it('disables inputs during submission', async () => {
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByLabelText(/username/i)).toBeDisabled();
    expect(screen.getByLabelText(/^email$/i)).toBeDisabled();
  });
});
