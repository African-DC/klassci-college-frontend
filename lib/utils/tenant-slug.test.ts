import { describe, expect, it } from "vitest"
import { resolveTenantSlug } from "./tenant-slug"

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
