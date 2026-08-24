import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SignInScreen } from "../App.jsx";

describe("SignInScreen (sign-in flow UI)", () => {
  it("submits the typed email, trimmed, when the form is submitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);

    render(<SignInScreen onSubmit={onSubmit} onVerifyCode={vi.fn()} sent={false} error="" />);

    await user.type(screen.getByLabelText("Email address"), "  person@example.com  ");
    await user.click(screen.getByRole("button", { name: /send my magic link/i }));

    expect(onSubmit).toHaveBeenCalledWith("person@example.com");
  });

  it("does not submit an empty email", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<SignInScreen onSubmit={onSubmit} onVerifyCode={vi.fn()} sent={false} error="" />);
    await user.click(screen.getByRole("button", { name: /send my magic link/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows the code-verification step once a magic link has been sent", () => {
    render(<SignInScreen onSubmit={vi.fn()} onVerifyCode={vi.fn()} sent={true} error="" />);

    expect(screen.getByLabelText("6-digit verification code")).toBeInTheDocument();
  });

  it("surfaces an auth error message", () => {
    render(<SignInScreen onSubmit={vi.fn()} onVerifyCode={vi.fn()} sent={false} error="Invalid email" />);

    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });
});
