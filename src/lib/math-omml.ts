/**
 * LaTeX → OMML pipeline for Word export.
 *
 * Render-time: formatters emit `<span class="math-eq" data-latex-b64="..." data-display="0|1">FALLBACK</span>`
 * so the browser preview shows Unicode/HTML fallback while the original LaTeX
 * is preserved in a data attribute.
 *
 * Export-time: `preprocessElementForOmml(root)` walks those spans and replaces
 * them with real OMML (`<m:oMath>` / `<m:oMathPara>`), which Microsoft Word
 * renders as native, editable equations when the wrapping HTML declares the
 * `xmlns:m` math namespace.
 */
import temml from 'temml';
import { mml2omml } from 'mathml2omml';

const MATH_CLASS = 'math-eq';

// Encode LaTeX to a HTML-safe base64 string (unicode-safe).
export const encodeLatex = (latex: string): string => {
  try {
    // encodeURIComponent → UTF-8 bytes → base64
    return btoa(unescape(encodeURIComponent(latex)));
  } catch {
    return '';
  }
};

const decodeLatex = (b64: string): string => {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return '';
  }
};

/**
 * Wrap a math block for the preview DOM: contains the Unicode/HTML fallback
 * visible in-browser, plus the original LaTeX in a data attribute so the
 * export pipeline can reconstruct OMML.
 */
export const wrapMathMarker = (
  latex: string,
  display: boolean,
  fallbackHtml: string,
): string => {
  const b64 = encodeLatex(latex.trim());
  const disp = display ? '1' : '0';
  if (display) {
    // Block-level marker keeps math visually separated in preview.
    return `<span class="${MATH_CLASS}" data-latex-b64="${b64}" data-display="${disp}" style="display:inline-block;margin:2px 0">${fallbackHtml}</span>`;
  }
  return `<span class="${MATH_CLASS}" data-latex-b64="${b64}" data-display="${disp}">${fallbackHtml}</span>`;
};

/** Convert a single LaTeX string to an OMML XML fragment. */
const latexToOmml = (latex: string, display: boolean): string | null => {
  try {
    const mml = temml.renderToString(latex, {
      displayMode: display,
      throwOnError: false,
      annotate: false,
      xml: true,
    });
    if (!mml) return null;
    let omml = mml2omml(mml);
    if (!omml) return null;
    // Ensure the math namespace prefix is declared on the root element so
    // Word HTML parses it correctly even when the wrapping <html> is missing
    // the xmlns:m declaration.
    if (!/xmlns:m=/.test(omml)) {
      omml = omml.replace(
        /^<m:oMath\b/,
        '<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"',
      );
    }
    if (display) {
      omml = `<m:oMathPara xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">${omml}</m:oMathPara>`;
    }
    return omml;
  } catch (err) {
    console.warn('[math-omml] latexToOmml failed:', err);
    return null;
  }
};

/**
 * Walk a DOM subtree and replace every `.math-eq` marker with its OMML
 * equivalent. Falls back to the pre-rendered Unicode HTML when temml can't
 * parse the input.
 */
export const preprocessElementForOmml = (root: HTMLElement): void => {
  if (!root) return;
  const markers = Array.from(
    root.querySelectorAll<HTMLElement>(`.${MATH_CLASS}[data-latex-b64]`),
  );
  for (const el of markers) {
    const b64 = el.getAttribute('data-latex-b64') || '';
    const display = el.getAttribute('data-display') === '1';
    const latex = decodeLatex(b64);
    if (!latex) continue;
    const omml = latexToOmml(latex, display);
    if (!omml) continue;
    // Replace fallback HTML with OMML fragment. Keep outer span so surrounding
    // whitespace/inline flow stays intact.
    el.innerHTML = omml;
    el.classList.remove(MATH_CLASS);
    el.classList.add('omml-eq');
    el.removeAttribute('data-latex-b64');
    el.removeAttribute('data-display');
    // For display equations, promote to block so Word treats it as its own
    // paragraph.
    if (display) {
      el.setAttribute('style', 'display:block;text-align:center;margin:4px 0');
    }
  }
};

/**
 * Serialize an element to Word-HTML `<body>` content with OMML equations
 * substituted in. Non-mutating: works on a shallow clone.
 */
export const serializeWithOmml = (el: HTMLElement): string => {
  const clone = el.cloneNode(true) as HTMLElement;
  preprocessElementForOmml(clone);
  return clone.innerHTML;
};

/**
 * Standard XML namespaces needed on the wrapping <html> element so Word
 * recognizes embedded OMML.
 */
export const WORD_HTML_NAMESPACES =
  "xmlns:o='urn:schemas-microsoft-com:office:office' " +
  "xmlns:w='urn:schemas-microsoft-com:office:word' " +
  "xmlns:m='http://schemas.openxmlformats.org/officeDocument/2006/math' " +
  "xmlns='http://www.w3.org/TR/REC-html40'";
