import { describe, expect, it } from "vitest";
import { matchColor, matchLabel, fmtTime, getTier } from "../App.jsx";

describe("matchColor", () => {
  it("returns teal for a strong match", () => {
    expect(matchColor(90)).toBe("#3DF2E0");
  });
  it("returns amber for a mid match", () => {
    expect(matchColor(70)).toBe("#FFB23D");
  });
  it("returns dim grey for a weak match", () => {
    expect(matchColor(20)).toBe("#5B5470");
  });
});

describe("matchLabel", () => {
  it("renders a percentage for a real match value", () => {
    expect(matchLabel(85)).toBe("85%");
  });
  it("renders 'No data' rather than a bare '%' when there's nothing to show", () => {
    expect(matchLabel(null)).toBe("No data");
  });
});

describe("fmtTime", () => {
  it("formats a zero offset as the day's own start time", () => {
    // Friday at Bonnaroo starts at 1:00 PM (per FESTIVAL_DAYS).
    expect(fmtTime(0, "fri", "bonnaroo")).toBe("1:00 PM");
  });
  it("adds the offset in minutes onto the start time", () => {
    expect(fmtTime(90, "fri", "bonnaroo")).toBe("2:30 PM");
  });
});

describe("getTier", () => {
  it("gives a brand-new member the first-timer tier", () => {
    expect(getTier(0).id).toBe("newcomer");
  });
  it("promotes karma past a threshold to the matching tier", () => {
    expect(getTier(900).id).toBe("veteran");
  });
  it("picks the highest tier whose minimum is met, not the first match", () => {
    expect(getTier(5000).id).toBe("legend");
  });
});
