import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "@/app/login/page";
import { signIn } from "@/lib/auth/actions";

vi.mock("@/lib/auth/actions", () => ({
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
  signUp: vi.fn(),
}));

const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: mockGet }),
}));

describe("Auth page (login)", () => {
  beforeEach(() => {
    mockGet.mockImplementation(() => null);
  });

  it("renders sign-in mode by default", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("heading", { name: /Welcome back/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument();
    expect(screen.getByTestId("auth-submit-signin")).toBeInTheDocument();
  });

  it("switches to create account mode", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("tab", { name: /create account/i }));
    expect(
      screen.getByRole("heading", { name: /Start selling today/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Full name$/i)).toBeInTheDocument();
  });

  it("validates email format on sign in", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/^Email$/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.click(screen.getByTestId("auth-submit-signin"));

    await waitFor(() => {
      expect(
        screen.getByText(/Enter a valid email address/i),
      ).toBeInTheDocument();
    });
  });

  it("calls signIn on valid submission", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/^Email$/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "password123" },
    });

    vi.mocked(signIn).mockResolvedValue({ success: true });

    fireEvent.click(screen.getByTestId("auth-submit-signin"));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });
});
