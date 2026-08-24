import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDMs } from "./useDMs";
import { supabase } from "./supabaseClient";
import { fakeQueryResult } from "../test/mockSupabase.js";

describe("useDMs.sendMessage (DM flow)", () => {
  it("inserts the message under the sender and appends it to the thread", async () => {
    const sentRow = { id: "msg-1", thread_id: "thread-1", sender_id: "profile-1", text: "hey", created_at: "2026-01-01T00:00:00Z", attachment_path: null };
    vi.spyOn(supabase, "from").mockImplementation((table) => {
      if (table === "dm_messages") return fakeQueryResult({ data: sentRow, error: null });
      return fakeQueryResult({ data: [], error: null }); // dm_participants lookup during mount refresh()
    });

    const { result } = renderHook(() => useDMs("profile-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const outcome = await result.current.sendMessage("thread-1", "hey");

    expect(outcome.data).toMatchObject({ id: "msg-1", text: "hey", from: "you" });
  });

  it("returns the error and doesn't touch state when the insert fails", async () => {
    vi.spyOn(supabase, "from").mockReturnValue(fakeQueryResult({ data: [], error: null }));
    const { result } = renderHook(() => useDMs("profile-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.spyOn(supabase, "from").mockImplementation((table) => {
      if (table === "dm_messages") return fakeQueryResult({ data: null, error: { message: "insert failed" } });
      return fakeQueryResult({ data: [], error: null });
    });

    const outcome = await result.current.sendMessage("thread-1", "hey");

    expect(outcome.error.message).toBe("insert failed");
  });
});
