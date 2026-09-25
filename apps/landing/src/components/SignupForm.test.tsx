import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { SignupForm } from "./SignupForm"

function fillAndSubmit(email: string) {
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: email } })
  fireEvent.click(screen.getByRole("button"))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("SignupForm", () => {
  it("idle: shows the default button label and the counter fallback", () => {
    render(<SignupForm count={null} onSuccess={() => {}} />)
    expect(screen.getByRole("button")).toHaveTextContent("Notify me")
    expect(screen.getByText("— signups so far")).toBeInTheDocument()
  })

  it("loading: disables the button and shows the pending label while the request is in flight", async () => {
    let resolveFetch: (value: Response) => void = () => {}
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((resolve) => { resolveFetch = resolve })),
    )

    render(<SignupForm count={3} onSuccess={() => {}} />)
    fillAndSubmit("dev@example.com")

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("Sending…"))
    expect(screen.getByRole("button")).toBeDisabled()

    resolveFetch(new Response(JSON.stringify({ count: 4 }), { status: 200 }))
  })

  it("error: shows the exact error copy and re-enables the button immediately", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(null, { status: 500 }))))

    render(<SignupForm count={3} onSuccess={() => {}} />)
    fillAndSubmit("dev@example.com")

    await waitFor(() =>
      expect(screen.getByText("Couldn't save that — check the address and try again.")).toBeInTheDocument(),
    )
    expect(screen.getByRole("button")).not.toBeDisabled()
    expect(screen.getByRole("button")).toHaveTextContent("Notify me")
  })

  it("success: clears the field, shows the confirmation label, and reports the server count", async () => {
    const onSuccess = vi.fn()
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ count: 7 }), { status: 200 }))),
    )

    render(<SignupForm count={6} onSuccess={onSuccess} />)
    fillAndSubmit("dev@example.com")

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("You're in"))
    expect(onSuccess).toHaveBeenCalledWith(7)
    expect(screen.getByPlaceholderText("you@example.com")).toHaveValue("")
  })
})
