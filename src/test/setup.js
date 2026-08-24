import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { supabase } from "../lib/supabaseClient";

beforeEach(() => {
  // Realtime subscriptions aren't what these tests exercise, and against
  // the fake .env.test project URL a real subscribe() would just hang
  // trying to open a websocket that can never connect.
  vi.spyOn(supabase, "channel").mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  });
  vi.spyOn(supabase, "removeChannel").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
