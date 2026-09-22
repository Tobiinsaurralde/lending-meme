/**
 * Intentionally empty.
 *
 * Turbopack's resolveAlias needs a real module path (it cannot alias to
 * `false` the way webpack can), so optional dependencies that are never
 * executed in a browser build — React Native async storage, the x402 payment
 * SDKs, pino-pretty — are aliased here.
 */
export default {};
