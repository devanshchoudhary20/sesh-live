import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"

vi.mock("../hooks/useLiveSession", () => ({
  useLiveSession: () => ({ live: false, viewers: 0 }),
}))

afterEach(() => {
  cleanup()
  vi.resetModules()
})

describe("Hero recording slot", () => {
  it("renders the poster placeholder with no video element when no demo video URL is configured", async () => {
    vi.doMock("../config", () => ({
      DEMO_VIDEO_URL: "",
      DEMO_POSTER_URL: "/demo-poster.png",
      DEMO_SESSION_URL: "",
      RELAY_ORIGIN: "http://localhost:8787",
      STATS_POLL_MS: 10_000,
    }))
    const { Hero } = await import("./Hero")
    render(<Hero />)

    expect(document.querySelector("video")).not.toBeInTheDocument()
    expect(screen.getByText("Live demo runs during the launch window; recording coming")).toBeInTheDocument()
  })

  it("renders a controllable video element when VITE_DEMO_VIDEO_URL is set", async () => {
    vi.doMock("../config", () => ({
      DEMO_VIDEO_URL: "/demo.mp4",
      DEMO_POSTER_URL: "/demo-poster.png",
      DEMO_SESSION_URL: "",
      RELAY_ORIGIN: "http://localhost:8787",
      STATS_POLL_MS: 10_000,
    }))
    const { Hero } = await import("./Hero")
    render(<Hero />)

    const video = document.querySelector("video")
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute("controls")
    expect(screen.queryByText("Live demo runs during the launch window; recording coming")).not.toBeInTheDocument()
  })
})
