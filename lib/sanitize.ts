import DOMPurify from "dompurify"

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "b", "i",
      "h2", "h3", "h4",
      "ul", "ol", "li",
      "a", "img",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "span", "div", "hr",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "width", "height",
      "class", "id", "target", "rel",
    ],
    ALLOW_DATA_ATTR: false,
  })
}
