import { CodeBlock } from "./CodeBlock"
import { DEMO_POSTER_URL, DEMO_VIDEO_URL } from "../config"

const FRIEND_SENTENCE =
  "Run npx sesh claude instead of claude, send me the link, and I can watch your session and grab the keyboard when it goes sideways. It never leaves your laptop."
const SUBHEAD =
  "For solo devs and small teams who pair with a cofounder, contractor, or friend in another city."
const INSTALL_COMMAND = "npx sesh claude"

export function Hero() {
  return (
    <section className="hero">
      <h1 className="headline">{FRIEND_SENTENCE}</h1>
      <p className="subhead">{SUBHEAD}</p>

      <div className="recording-slot">
        <video
          className="recording-video"
          width={960}
          height={540}
          poster={DEMO_POSTER_URL}
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={DEMO_VIDEO_URL} />
        </video>
      </div>

      <CodeBlock code={INSTALL_COMMAND} />
    </section>
  )
}
