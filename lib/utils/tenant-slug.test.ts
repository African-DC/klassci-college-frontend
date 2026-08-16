import { describe, expect, it } from "vitest"
import { resolveSchoolLoginCode, resolveTenantSlug } from "./tenant-slug"

describe("resolveTenantSlug", () => {
  it("accepts a lowercase tenant slug", () => {
    expect(resolveTenantSlug("college-saint-michel")).toEqual({
      status: "valid",
      tenant: "college-saint-michel",
    })
  })

  it.each([
    [undefined, "missing"],
    ["", "invalid"],
    ["College-Saint-Michel", "invalid"],
    ["-college", "invalid"],
    ["college-", "invalid"],
    ["college_saint_michel", "invalid"],
    [["college-a", "college-b"], "invalid"],
  ] as const)("rejects %j as %s", (value, status) => {
    expect(resolveTenantSlug(value)).toEqual({ status })
  })
})

describe("resolveSchoolLoginCode", () => {
  it("maps the Rostan school code", () => {
    expect(resolveSchoolLoginCode("ROSTAN")).toBe("rostan-bouake")
    expect(resolveSchoolLoginCode(" rostan bouake ")).toBe("rostan-bouake")
    expect(resolveSchoolLoginCode("college-rostan")).toBe("rostan-bouake")
  })

  it("keeps a valid technical slug", () => {
    expect(resolveSchoolLoginCode("lycee-moderne")).toBe("lycee-moderne")
  })

  it("rejects empty or illegal values", () => {
    expect(resolveSchoolLoginCode("")).toBeNull()
    expect(resolveSchoolLoginCode("???")).toBeNull()
  })
})
