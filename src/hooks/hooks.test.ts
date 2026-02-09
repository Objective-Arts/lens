/**
 * Tests for hooks module.
 */

import { describe, it, expect } from "vitest";
import {
  readSettings,
  listHooks,
  listPresets,
  setupPreset,
  hasWorkflowMarkerHook,
} from "./index.js";

describe("Hooks Module", () => {
  describe("readSettings", () => {
    it("returns object", () => {
      const settings = readSettings();
      expect(settings).toBeDefined();
      expect(typeof settings).toBe("object");
    });
  });

  describe("listPresets", () => {
    it("returns workflow-marker preset", () => {
      const presets = listPresets();

      expect(presets).toHaveLength(1);
      expect(presets[0].name).toBe("workflow-marker");
      expect(presets[0].description).toContain("workflow");
    });
  });

  describe("listHooks", () => {
    it("returns array of hooks", () => {
      const hooks = listHooks();

      expect(Array.isArray(hooks)).toBe(true);
      for (const hook of hooks) {
        expect(hook).toHaveProperty("event");
        expect(hook).toHaveProperty("matcher");
        expect(hook).toHaveProperty("type");
        expect(hook).toHaveProperty("description");
        expect(hook).toHaveProperty("id");
      }
    });
  });

  describe("hasWorkflowMarkerHook", () => {
    it("returns false for empty settings", () => {
      expect(hasWorkflowMarkerHook({})).toBe(false);
    });

    it("returns false for settings without hooks", () => {
      expect(hasWorkflowMarkerHook({ model: "Opus" })).toBe(false);
    });

    it("returns true for settings with workflow marker hook", () => {
      expect(hasWorkflowMarkerHook({
        hooks: {
          PreToolUse: [
            {
              matcher: "Edit|Write",
              hooks: [
                {
                  type: "command",
                  command: "marker=\".claude/active-workflow.json\"; exit 1",
                },
              ],
            },
          ],
        },
      })).toBe(true);
    });
  });

  describe("setupPreset/removePreset", () => {
    it("setupPreset returns success", () => {
      const result = setupPreset("workflow-marker");
      expect(result.success).toBe(true);
    });

    it("returns error for unknown preset", () => {
      const result = setupPreset("unknown" as any);
      expect(result.success).toBe(false);
    });
  });
});
