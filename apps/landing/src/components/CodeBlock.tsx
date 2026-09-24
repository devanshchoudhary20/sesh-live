import { useCopyToClipboard } from "../hooks/useCopyToClipboard"

interface CodeBlockProps {
  code: string
}

export function CodeBlock({ code }: CodeBlockProps) {
  const { copied, copy } = useCopyToClipboard()
  const buttonLabel = copied ? "Copied" : "Copy"

  return (
    <div className="code-block">
      <code>{code}</code>
      <button type="button" className="copy-button" onClick={() => copy(code)}>
        {buttonLabel}
      </button>
    </div>
  )
}
