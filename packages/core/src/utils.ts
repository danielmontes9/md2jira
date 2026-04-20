/**
 * Returns true when an unknown remark node carries a string `.value` field.
 * Shared between converter.ts and adf-converter.ts to avoid duplicating the
 * inline `as { value: unknown }` cast in each default-case fallback.
 */
export function hasStringValue(node: object): node is { value: string } {
  return 'value' in node && typeof (node as { value: unknown }).value === 'string'
}
