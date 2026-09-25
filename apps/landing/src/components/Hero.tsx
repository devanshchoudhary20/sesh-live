import { CodeBlock } from "./CodeBlock"
import { LiveSessionLink } from "./LiveSessionLink"
import { DEMO_POSTER_URL, DEMO_VIDEO_URL } from "../config"

const FRIEND_SENTENCE =
  "Run npx sesh-live claude instead of claude, send me the link, and I can watch your session live. The agent runs on your laptop; the terminal stream goes through a relay, end-to-end encryption is next."
const SUBHEAD =
  "For solo devs and small teams who pair with a cofounder, contractor, or friend in another city."
const INSTALL_COMMAND = "npx sesh-live claude"
const NO_VIDEO_COPY = "Live demo runs during the launch window; recording coming"

export function Hero() {
  const hasDemoVideo = Boolean(DEMO_VIDEO_URL)

  return (
    <section className="hero">
      <h1 className="headline">{FRIEND_SENTENCE}</h1>
      <p className="subhead">{SUBHEAD}</p>

      <LiveSessionLink />

      <div className="recording-slot">
        {hasDemoVideo ? (
          <video
            className="recording-video"
            width={960}
            height={540}
            poster={DEMO_POSTER_URL}
            controls
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src={DEMO_VIDEO_URL} />
          </video>
        ) : (
          <div
            className="recording-placeholder"
            style={{ backgroundImage: `url(${DEMO_POSTER_URL})` }}
          >
            <span>{NO_VIDEO_COPY}</span>
          </div>
        )}
      </div>

      <CodeBlock code={INSTALL_COMMAND} />
    </section>
  )
}
