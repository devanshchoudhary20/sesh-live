// mirrors apps/relay/src/routing.ts isValidEmail; duplicated per the project's two-consumer rule (screens.md tokens.css note)
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim()
  return trimmed.length >= 3 && trimmed.includes("@") && !trimmed.includes(" ")
}
