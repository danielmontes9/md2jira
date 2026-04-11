const TABLE_ROW_RE = /^\s*\|/
const TABLE_SEP_RE = /^\s*\|[\s\-:|]+\|/

/**
 * Collapses empty lines that fall inside a GFM table block.
 *
 * When a user deletes a row from a table in the editor it may leave an empty
 * line between the separator row and the remaining data rows. Because GFM
 * tables cannot span empty lines, remark-gfm stops parsing the table at that
 * point and treats the following pipe-delimited rows as plain paragraphs.
 * This preprocessing step removes those stray empty lines so the full table
 * is always parsed as a single block.
 *
 * Also normalises Windows (CRLF) and legacy Mac (CR) line endings to LF so
 * that browsers on Windows don't produce stray \r characters (e.g. \r\r\n)
 * when the user deletes a line, which would confuse remark-gfm.
 */
export function preprocessMarkdown(md: string): string {
  // Normalise all line endings to \n first
  const normalised = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalised.split('\n')
  const result: string[] = []
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    if (TABLE_SEP_RE.test(line)) {
      inTable = true
      result.push(line)
    } else if (inTable && line.trim() === '') {
      // Look ahead: if the next non-empty line is still a table row, this
      // empty line is noise left over from a deletion — skip it.
      let j = i + 1
      while (j < lines.length && lines[j]!.trim() === '') j++
      if (j < lines.length && TABLE_ROW_RE.test(lines[j]!)) {
        // still inside the table — drop the empty line
        continue
      }
      // empty line genuinely ends the table
      inTable = false
      result.push(line)
    } else if (inTable && !TABLE_ROW_RE.test(line)) {
      inTable = false
      result.push(line)
    } else {
      result.push(line)
    }
  }

  return result.join('\n')
}
