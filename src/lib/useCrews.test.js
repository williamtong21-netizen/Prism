import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCrews } from "./useCrews";
import { supabase } from "./supabaseClient";
import { fakeQueryResult } from "../test/mockSupabase.js";

describe("useCrews.joinCrew (crew-join flow)", () => {
  it("normalizes the typed code and joins through the rate-limited RPC", async () => {
    vi.spyOn(supabase, "from").mockReturnValue(fakeQueryResult({ data: [], error: null }));
    const rpc = vi.spyOn(supabase, "rpc").mockResolvedValue({ data: { id: "crew-1", name: "The Squad" }, error: null });

    const { result } = renderHook(() => useCrews("profile-1"));

    const outcome = await result.current.joinCrew("abc 123");

    // People retype codes without the dash, lowercase, with stray spaces --
    // the RPC always sees the canonical "XXX-XXX" form regardless.
    expect(rpc).toHaveBeenCalledWith("join_crew_by_code", { join_code: "ABC-123" });
    expect(outcome).toEqual({ data: { id: "crew-1", name: "The Squad" } });
  });

  it("surfaces the RPC's own error payload (e.g. the rate limit) as a real error", async () => {
    vi.spyOn(supabase, "from").mockReturnValue(fakeQueryResult({ data: [], error: null }));
    vi.spyOn(supabase, "rpc").mockResolvedValue({
      data: { error: "Too many join attempts — wait a few minutes and try again." },
      error: null,
    });

    const { result } = renderHook(() => useCrews("profile-1"));

    const outcome = await result.current.joinCrew("ABC-123");

    expect(outcome.error.message).toBe("Too many join attempts — wait a few minutes and try again.");
  });

  it("surfaces a transport-level RPC error too", async () => {
    vi.spyOn(supabase, "from").mockReturnValue(fakeQueryResult({ data: [], error: null }));
    vi.spyOn(supabase, "rpc").mockResolvedValue({ data: null, error: { message: "network error" } });

    const { result } = renderHook(() => useCrews("profile-1"));

    const outcome = await result.current.joinCrew("ABC-123");

    expect(outcome.error.message).toBe("network error");
  });
});
