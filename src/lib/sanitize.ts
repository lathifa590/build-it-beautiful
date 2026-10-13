import DOMPurify from 'dompurify';

/**
 * Sanitize untrusted HTML to prevent Cross-Site Scripting (XSS - OWASP A05).
 * Allowed tags and attributes are restricted to safe typography and math rendering.
 */
export function sanitizeHtml(untrustedHtml: string): string {
  if (!untrustedHtml || typeof untrustedHtml !== 'string') return '';
  return DOMPurify.sanitize(untrustedHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'sub', 'sup',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'span', 'div', 'img', 'a',
      // SVG/MathML tags for KaTeX/Temml rendering
      'svg', 'path', 'line', 'rect', 'circle', 'math', 'semantics', 'annotation',
      'annotation-xml', 'mrow', 'mi', 'mn', 'mo', 'ms', 'mspace', 'mtext',
      'mfrac', 'msqrt', 'mroot', 'msub', 'msup', 'msubsup', 'munder', 'mover', 'munderover',
      'mtable', 'mtr', 'mtd', 'mpadded', 'mphantom', 'menclose'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'className',
      'style', 'width', 'height', 'align', 'colspan', 'rowspan',
      // SVG/MathML attributes
      'viewBox', 'xmlns', 'd', 'fill', 'stroke', 'stroke-width', 'aria-hidden'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\/:-]|$))/i,
  });
}
