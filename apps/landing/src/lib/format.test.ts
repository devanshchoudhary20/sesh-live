import { describe, expect, it } from "vitest"
import { formatSignupCount } from "./format"

describe("formatSignupCount", () => {
  it("shows the em-dash fallback before the first successful fetch", () => {
    expect(formatSignupCount(null)).toBe("— signups so far")
  })

  it("shows the resolved-zero copy for an empty list", () => {
    expect(formatSignupCount(0)).toBe("Be the first to sign up")
  })

  it("uses the singular for exactly one signup", () => {
    expect(formatSignupCount(1)).toBe("1 signup so far")
  })

  it("shows the count once signups exist", () => {
    expect(formatSignupCount(12)).toBe("12 signups so far")
  })
})
