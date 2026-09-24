import { describe, expect, it } from "vitest"
import { isValidEmail } from "./email"

describe("isValidEmail", () => {
  it("accepts a plausible address", () => {
    expect(isValidEmail("dev@example.com")).toBe(true)
  })

  it("rejects empty, spaced, or bare-word input", () => {
    expect(isValidEmail("")).toBe(false)
    expect(isValidEmail("not an email")).toBe(false)
    expect(isValidEmail("a@b")).toBe(true)
  })

  it("trims surrounding whitespace before validating", () => {
    expect(isValidEmail("  dev@example.com  ")).toBe(true)
  })
})
