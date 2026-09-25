// null means "never fetched"; distinct from a resolved 0, which gets its own copy per screens.md
export function formatSignupCount(count: number | null): string {
  if (count === null) return "— signups so far"
  if (count === 0) return "Be the first to sign up"
  if (count === 1) return "1 signup so far"
  return `${count} signups so far`
}
