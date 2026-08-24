import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "./useAuth";
import { supabase } from "./supabaseClient";

describe("useAuth.signInWithEmail (sign-in flow)", () => {
  it("sends a magic link to the trimmed email and flips magicLinkSent on success", async () => {
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: null } });
    vi.spyOn(supabase.auth, "onAuthStateChange").mockReturnValue({ data: { subscription: { unsubscribe: () => {} } } });
    const signInWithOtp = vi.spyOn(supabase.auth, "signInWithOtp").mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.session).toBe(null));

    let ok;
    await act(async () => {
      ok = await result.current.signInWithEmail("  person@example.com  ");
    });

    expect(ok).toBe(true);
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "  person@example.com  ", // caller (SignInScreen) trims before calling; the hook itself doesn't
      options: { emailRedirectTo: window.location.origin },
    });
    expect(result.current.magicLinkSent).toBe(true);
    expect(result.current.authError).toBe("");
  });

  it("surfaces the error message and returns false when Supabase rejects the email", async () => {
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: null } });
    vi.spyOn(supabase.auth, "onAuthStateChange").mockReturnValue({ data: { subscription: { unsubscribe: () => {} } } });
    vi.spyOn(supabase.auth, "signInWithOtp").mockResolvedValue({ error: { message: "Invalid email" } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.session).toBe(null));

    let ok;
    await act(async () => {
      ok = await result.current.signInWithEmail("not-an-email");
    });

    expect(ok).toBe(false);
    expect(result.current.authError).toBe("Invalid email");
    expect(result.current.magicLinkSent).toBe(false);
  });
});
