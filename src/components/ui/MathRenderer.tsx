import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { wrapMathMarker } from '@/lib/math-omml';


interface MathRendererProps {
  text: string;
  className?: string;
}

// Build HTML fraction from numerator and denominator
const buildFractionHtml = (num: string, den: string): string => {
  return `<span style="display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:0.85em;margin:0 2px;line-height:1.2;"><span style="border-bottom:1px solid currentColor;padding:0 2px;">${num}</span><span style="padding:0 2px;">${den}</span></span>`;
};

// Match nested braces starting from a given index
const matchNestedBraces = (text: string, startIndex: number): { content: string; endIndex: number } | null => {
  if (text[startIndex] !== '{') return null;
  
  let depth = 1;
  let i = startIndex + 1;
  
  while (i < text.length && depth > 0) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    i++;
  }
  
  if (depth !== 0) return null;
  
  return {
    content: text.substring(startIndex + 1, i - 1),
    endIndex: i
  };
};

// Handle set notation: \{ → { and \} → }
const preprocessSetNotation = (text: string): string => {
  let result = text;
  result = result.replace(/\\\{/g, '{');
  result = result.replace(/\\\}/g, '}');
  return result;
};

// Repair LaTeX that was corrupted by JSON.parse eating backslash escapes.
// Common symptoms in LKPD output:
//   "\to"  -> TAB char (\t) + "o"  →  "lim_{x o 0}"
//   "\n"   -> newline,   "\b" -> backspace
// Also restores missing backslash on common math funcs when adjacent to _ or {.
const preprocessRepairLatex = (text: string): string => {
  let result = text;

  // 1. TAB between math-ish chars almost always = broken \to
  result = result.replace(/([A-Za-z0-9}\)])\t+([A-Za-z0-9{\(])/g, '$1 \\to $2');
  result = result.replace(/\t/g, ' ');

  // 2. Fix " o " → " \to " inside lim subscript (lim_{x o 0})
  result = result.replace(/(\\?lim_\{)([^}]*)\}/gi, (_, head, inner) => {
    return `${head}${inner.replace(/\s+o\s+/g, ' \\to ')}}`;
  });

  // 3. Restore missing backslash on common funcs followed by _ or {
  result = result.replace(
    /(^|[\s\(\[\{=+\-*/,])(lim|sin|cos|tan|sec|csc|cot|log|ln|sqrt|frac)([_{])/g,
    '$1\\$2$3',
  );

  return result;
};

// Convert Markdown pipe tables to HTML tables (Word-compatible inline styles).
const preprocessMarkdownTables = (text: string): string => {
  const lines = text.split('\n');
  const out: string[] = [];
  let i = 0;
  const isPipeRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
  const isSeparator = (l: string) =>
    /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(l);
  const splitCells = (l: string) =>
    l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1];
    if (line && next && isPipeRow(line) && isSeparator(next)) {
      const headers = splitCells(line);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isPipeRow(lines[j])) {
        rows.push(splitCells(lines[j]));
        j++;
      }
      const th = headers
        .map((h) => `<th style="border:1px solid #000;padding:6px;background:#f1f5f9;text-align:left">${h}</th>`)
        .join('');
      const trs = rows
        .map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #000;padding:6px;vertical-align:top">${c}</td>`).join('')}</tr>`)
        .join('');
      out.push(`<table style="border-collapse:collapse;width:100%;margin:8px 0;border:1px solid #000"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`);
      i = j;
      continue;
    }
    out.push(line);
    i++;
  }
  return out.join('\n');
};

// Handle \sqrt with nested content
const preprocessSqrt = (text: string): string => {
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    // Check for \sqrt{ pattern
    if (text.substring(i, i + 6) === '\\sqrt{') {
      const braceStart = i + 5; // Position of {
      const match = matchNestedBraces(text, braceStart);
      
      if (match) {
        // Recursively process inner content
        const innerContent = preprocessSqrt(match.content);
        result += `√<span style="text-decoration:overline;">${innerContent}</span>`;
        i = match.endIndex;
      } else {
        result += text[i];
        i++;
      }
    } else {
      result += text[i];
      i++;
    }
  }
  
  return result;
};

// Handle fractions with nested braces support
const preprocessFractionsAdvanced = (text: string): string => {
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    // Check for \frac{ pattern
    if (text.substring(i, i + 6) === '\\frac{') {
      const numBraceStart = i + 5; // Position of first {
      const numMatch = matchNestedBraces(text, numBraceStart);
      
      if (numMatch) {
        // Look for denominator immediately after numerator
        const denMatch = matchNestedBraces(text, numMatch.endIndex);
        
        if (denMatch) {
          // Recursively process both parts
          const num = preprocessFractionsAdvanced(numMatch.content);
          const den = preprocessFractionsAdvanced(denMatch.content);
          result += buildFractionHtml(num, den);
          i = denMatch.endIndex;
          continue;
        }
      }
      // Fallback: just add the character and move on
      result += text[i];
      i++;
    } else {
      result += text[i];
      i++;
    }
  }
  
  return result;
};

// Legacy fraction handler for simple cases and broken patterns
const preprocessFractionsLegacy = (text: string): string => {
  let result = text;
  
  // Match the broken pattern where \f becomes a special char (form feed = \x0C or other)
  result = result.replace(/[\x0C\uFFFD▲]rac\{([^{}]+)\}\{([^{}]+)\}/g, (_, num, den) => {
    return buildFractionHtml(num, den);
  });
  
  // Match literal "frac{num}{den}" without backslash (in case backslash was stripped)
  result = result.replace(/(?<![a-zA-Z])frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, num, den) => {
    return buildFractionHtml(num, den);
  });
  
  return result;
};

// Preprocessing: convert standalone LaTeX commands to Unicode BEFORE math processing
const preprocessStandaloneLatex = (text: string): string => {
  let result = text;
  
  // Comprehensive LaTeX to Unicode mapping
  const latexToUnicode: Record<string, string> = {
    // Arrows
    '\\rightarrow': '→',
    '\\leftarrow': '←',
    '\\to': '→',
    '\\gets': '←',
    '\\mapsto': '↦',
    '\\Rightarrow': '⇒',
    '\\Leftarrow': '⇐',
    '\\leftrightarrow': '↔',
    '\\Leftrightarrow': '⇔',
    '\\uparrow': '↑',
    '\\downarrow': '↓',
    // Operators
    '\\times': '×',
    '\\div': '÷',
    '\\pm': '±',
    '\\mp': '∓',
    '\\cdot': '⋅',
    '\\ast': '∗',
    '\\star': '⋆',
    '\\circ': '∘',
    // Comparison
    '\\leq': '≤',
    '\\geq': '≥',
    '\\neq': '≠',
    '\\approx': '≈',
    '\\equiv': '≡',
    '\\sim': '∼',
    '\\cong': '≅',
    '\\propto': '∝',
    // Greek lowercase
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\epsilon': 'ε',
    '\\zeta': 'ζ',
    '\\eta': 'η',
    '\\theta': 'θ',
    '\\iota': 'ι',
    '\\kappa': 'κ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\nu': 'ν',
    '\\xi': 'ξ',
    '\\pi': 'π',
    '\\rho': 'ρ',
    '\\sigma': 'σ',
    '\\tau': 'τ',
    '\\upsilon': 'υ',
    '\\phi': 'φ',
    '\\chi': 'χ',
    '\\psi': 'ψ',
    '\\omega': 'ω',
    // Greek uppercase
    '\\Gamma': 'Γ',
    '\\Delta': 'Δ',
    '\\Theta': 'Θ',
    '\\Lambda': 'Λ',
    '\\Xi': 'Ξ',
    '\\Pi': 'Π',
    '\\Sigma': 'Σ',
    '\\Upsilon': 'Υ',
    '\\Phi': 'Φ',
    '\\Psi': 'Ψ',
    '\\Omega': 'Ω',
    // Set theory
    '\\in': '∈',
    '\\notin': '∉',
    '\\subset': '⊂',
    '\\supset': '⊃',
    '\\subseteq': '⊆',
    '\\supseteq': '⊇',
    '\\cup': '∪',
    '\\cap': '∩',
    '\\emptyset': '∅',
    '\\varnothing': '∅',
    // Logic
    '\\forall': '∀',
    '\\exists': '∃',
    '\\neg': '¬',
    '\\land': '∧',
    '\\lor': '∨',
    '\\therefore': '∴',
    '\\because': '∵',
    // Misc symbols
    '\\infty': '∞',
    '\\partial': '∂',
    '\\nabla': '∇',
    '\\sum': '∑',
    '\\prod': '∏',
    '\\int': '∫',
    '\\deg': '°',
    '\\angle': '∠',
    '\\perp': '⊥',
    '\\parallel': '∥',
    // Dots
    '\\dots': '…',
    '\\ldots': '…',
    '\\cdots': '⋯',
    '\\vdots': '⋮',
    '\\ddots': '⋱',
    // Trig & log functions (safety net when AI emits raw \sin etc.)
    '\\arcsin': 'arcsin',
    '\\arccos': 'arccos',
    '\\arctan': 'arctan',
    '\\sinh': 'sinh',
    '\\cosh': 'cosh',
    '\\tanh': 'tanh',
    '\\sin': 'sin',
    '\\cos': 'cos',
    '\\tan': 'tan',
    '\\sec': 'sec',
    '\\csc': 'csc',
    '\\cot': 'cot',
    '\\log': 'log',
    '\\ln': 'ln',
    '\\lim': 'lim',
    '\\max': 'max',
    '\\min': 'min',
  };
  
  // Sort by length descending to match longer patterns first
  const sortedKeys = Object.keys(latexToUnicode).sort((a, b) => b.length - a.length);
  
  for (const latex of sortedKeys) {
    const unicode = latexToUnicode[latex];
    // Escape backslash for regex pattern
    const escaped = latex.replace(/\\/g, '\\\\');
    result = result.replace(new RegExp(escaped, 'g'), unicode);
  }
  
  return result;
};

// Convert common text math patterns to LaTeX
const preprocessMath = (text: string): string => {
  let result = text;

  // Handle sqrt(x) → \sqrt{x}
  result = result.replace(/sqrt\(([^)]+)\)/gi, '\\sqrt{$1}');

  // Handle fractions like a/b when surrounded by spaces or at word boundaries
  // Only simple numeric fractions to avoid breaking regular text
  result = result.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');

  // Handle exponents with parentheses: 2^(-2) → 2^{-2}
  result = result.replace(/\^?\(([^)]+)\)/g, (match, content) => {
    if (match.startsWith('^')) {
      return `^{${content}}`;
    }
    return match;
  });

  // Handle simple exponents without braces: x^2 → x^{2} (if not already braced)
  result = result.replace(/\^(\d+)(?!\})/g, '^{$1}');
  result = result.replace(/\^([a-zA-Z])(?!\})/g, '^{$1}');

  // Handle subscripts without braces: x_1 → x_{1}
  result = result.replace(/_(\d+)(?!\})/g, '_{$1}');
  result = result.replace(/_([a-zA-Z])(?!\})/g, '_{$1}');

  // Replace common symbols
  const symbolMap: Record<string, string> = {
    '×': '\\times',
    '÷': '\\div',
    '±': '\\pm',
    '≈': '\\approx',
    '≠': '\\neq',
    '≤': '\\leq',
    '≥': '\\geq',
    '→': '\\rightarrow',
    '←': '\\leftarrow',
    '∞': '\\infty',
    'π': '\\pi',
    'α': '\\alpha',
    'β': '\\beta',
    'θ': '\\theta',
    'Δ': '\\Delta',
    'Ω': '\\Omega',
    '°': '^{\\circ}',
  };

  for (const [symbol, latex] of Object.entries(symbolMap)) {
    result = result.replace(new RegExp(symbol, 'g'), latex);
  }

  return result;
};

// Render LaTeX math expression
const renderMath = (latex: string, displayMode: boolean = false): string => {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
      output: 'html',
      trust: true,
    });
  } catch (e) {
    console.error('KaTeX render error:', e);
    return latex;
  }
};

// Process text and render math expressions
const processContent = (text: string): string => {
  if (!text) return '';

  // STEP 0: Repair LaTeX corrupted by JSON.parse + convert markdown tables
  let result = preprocessRepairLatex(text);
  result = preprocessMarkdownTables(result);

  // STEP 1: Handle set notation first (\{ and \})
  result = preprocessSetNotation(result);

  // STEP 2: Handle fractions with nested braces support
  result = preprocessFractionsAdvanced(result);
  result = preprocessFractionsLegacy(result);

  // STEP 3: Handle sqrt with nested content
  result = preprocessSqrt(result);

  // STEP 4: Convert standalone LaTeX commands to Unicode
  result = preprocessStandaloneLatex(result);

  // Handle display math: $$...$$ or \[...\]
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const processed = preprocessMath(math);
    return `<span class="math-display">${renderMath(processed, true)}</span>`;
  });

  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    const processed = preprocessMath(math);
    return `<span class="math-display">${renderMath(processed, true)}</span>`;
  });

  // Handle inline math: $...$ or \(...\)
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    const processed = preprocessMath(math);
    return `<span class="math-inline">${renderMath(processed, false)}</span>`;
  });

  result = result.replace(/\\\(([^)]+?)\\\)/g, (_, math) => {
    const processed = preprocessMath(math);
    return `<span class="math-inline">${renderMath(processed, false)}</span>`;
  });

  // Now detect and convert remaining math-like patterns
  const mathPatterns = [
    // sqrt(x) patterns
    /sqrt\([^)]+\)/gi,
    // Fractions with numbers
    /\d+\/\d+/g,
    // Exponents: 2^3, x^2, 2^(-2)
    /\w+\^[\(\{\-]?[\w\-]+[\)\}]?/g,
    // LaTeX commands that weren't in delimiters
    /\\(sqrt|frac|times|div|pm|alpha|beta|theta|pi|infty|leq|geq|neq|approx)\{[^}]+\}/g,
  ];

  // Process remaining math patterns
  for (const pattern of mathPatterns) {
    result = result.replace(pattern, (match) => {
      // Skip if already processed (inside a math span)
      if (result.includes(`>${match}<`)) return match;
      const processed = preprocessMath(match);
      // Only wrap if it contains LaTeX commands after preprocessing
      if (processed.includes('\\')) {
        return `<span class="math-inline">${renderMath(processed, false)}</span>`;
      }
      return match;
    });
  }

  // Handle bold text
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Handle line breaks
  result = result.replace(/\n/g, '<br/>');

  return result;
};

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className }) => {
  const renderedContent = useMemo(() => processContent(text), [text]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

// Rich text formatter with math support (using KaTeX for beautiful rendering)
export const formatMathText = (text: unknown): React.ReactNode => {
  if (!text) return '';

  if (Array.isArray(text)) {
    return (
      <ul className="list-disc pl-5 m-0">
        {text.map((t, i) => (
          <li key={i}>{formatMathText(t)}</li>
        ))}
      </ul>
    );
  }

  if (typeof text === 'object' && text !== null) {
    return (
      <div className="pl-2">
        {Object.entries(text).map(([k, v], i) => (
          <div key={i} className="mb-1">
            <strong>{k.replace(/_/g, ' ')}: </strong>
            {formatMathText(v)}
          </div>
        ))}
      </div>
    );
  }

  return <MathRenderer text={String(text)} />;
};

// Unicode superscript/subscript maps
const SUP_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
  'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
  'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
  'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
  'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
};
const SUB_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
  'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
  'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
  'v': 'ᵥ', 'x': 'ₓ',
};

const toUnicodeSup = (s: string): string | null => {
  const out = s.split('').map((c) => SUP_MAP[c]).join('');
  return out.length === s.length && !out.includes('undefined') && s.split('').every((c) => SUP_MAP[c]) ? out : null;
};
const toUnicodeSub = (s: string): string | null => {
  const out = s.split('').map((c) => SUB_MAP[c]).join('');
  return out.length === s.length && s.split('').every((c) => SUB_MAP[c]) ? out : null;
};

// Convert one super/sub group to Unicode when possible; otherwise HTML tag.
const renderSup = (inner: string): string => {
  const uni = toUnicodeSup(inner);
  return uni ?? `<sup style="vertical-align:super;font-size:0.75em">${inner}</sup>`;
};
const renderSub = (inner: string): string => {
  const uni = toUnicodeSub(inner);
  return uni ?? `<sub style="vertical-align:sub;font-size:0.75em">${inner}</sub>`;
};

// Apply super/sub conversion globally.
const applyScripts = (text: string): string => {
  let r = text;
  // Braced: X^{abc}, X_{abc}
  r = r.replace(/\^\{([^{}]+)\}/g, (_, e) => renderSup(e));
  r = r.replace(/_\{([^{}]+)\}/g, (_, e) => renderSub(e));
  // Parenthesized: X^(abc)
  r = r.replace(/\^\(([^()]+)\)/g, (_, e) => renderSup(e));
  r = r.replace(/_\(([^()]+)\)/g, (_, e) => renderSub(e));
  // Single-char / numeric run: X^2, X^-3, X_ab
  // Single unbraced token: X^2, X^-3, X^n (only ONE digit-run or ONE letter)
  r = r.replace(/\^(-?\d+|[A-Za-z])/g, (_, e) => renderSup(e));
  r = r.replace(/_(-?\d+|[A-Za-z])/g, (_, e) => renderSub(e));
  return r;
};

// Handle bounded operators: ∫, ∑, ∏ with _a^b or ^b_a bounds.
const applyOperatorBounds = (text: string): string => {
  let r = text;
  const OPS = '[∫∑∏]';
  // ∫_{a}^{b} or ∫^{b}_{a}
  r = r.replace(new RegExp(`(${OPS})_\\{([^{}]+)\\}\\^\\{([^{}]+)\\}`, 'g'),
    (_, op, a, b) => `${op}${renderSub(a)}${renderSup(b)}`);
  r = r.replace(new RegExp(`(${OPS})\\^\\{([^{}]+)\\}_\\{([^{}]+)\\}`, 'g'),
    (_, op, b, a) => `${op}${renderSub(a)}${renderSup(b)}`);
  // ∫_a^b (simple tokens)
  r = r.replace(new RegExp(`(${OPS})_([A-Za-z0-9])\\^([A-Za-z0-9])`, 'g'),
    (_, op, a, b) => `${op}${renderSub(a)}${renderSup(b)}`);
  r = r.replace(new RegExp(`(${OPS})\\^([A-Za-z0-9])_([A-Za-z0-9])`, 'g'),
    (_, op, b, a) => `${op}${renderSub(a)}${renderSup(b)}`);
  // ∫_{a} only
  r = r.replace(new RegExp(`(${OPS})_\\{([^{}]+)\\}`, 'g'),
    (_, op, a) => `${op}${renderSub(a)}`);
  r = r.replace(new RegExp(`(${OPS})\\^\\{([^{}]+)\\}`, 'g'),
    (_, op, b) => `${op}${renderSup(b)}`);
  return r;
};

// Special case: lim_{x \to 0} → "lim" with subscript "x → 0" (kept readable in Word).
const applyLimit = (text: string): string => {
  return text.replace(/\blim_\{([^{}]+)\}/g, (_, inner) => {
    // inner may still contain \to which is already converted to → by standalone pass
    return `lim<sub style="vertical-align:sub;font-size:0.75em">${inner.trim()}</sub>`;
  });
};

// Strip LaTeX spacing commands and \left / \right.
const stripLatexSpacing = (text: string): string => {
  let r = text;
  r = r.replace(/\\,|\\;|\\:|\\!/g, ' ');
  r = r.replace(/\\quad|\\qquad/g, '  ');
  r = r.replace(/\\left([\(\[\|\{])/g, '$1');
  r = r.replace(/\\right([\)\]\|\}])/g, '$1');
  // Primes: f' stays as-is; \prime → ′
  r = r.replace(/\\prime/g, '′');
  return r;
};

// Run the Unicode/HTML fallback pipeline on already-delimited math inner text.
const renderMathFallback = (inner: string): string => {
  let r = preprocessSetNotation(inner);
  r = stripLatexSpacing(r);
  r = preprocessFractionsAdvanced(r);
  r = preprocessFractionsLegacy(r);
  r = preprocessSqrt(r);
  r = preprocessStandaloneLatex(r);
  r = applyLimit(r);
  r = applyOperatorBounds(r);
  r = applyScripts(r);
  return r;
};

// Simple text processor for export (no KaTeX, only Unicode + HTML fractions/sup/sub).
// This produces Word-compatible output. Delimited math is preserved as a
// `math-eq` marker so the export pipeline can emit OMML.
const processContentSimple = (text: string): string => {
  if (!text) return '';

  // Step 0: Repair LaTeX corrupted by JSON.parse + markdown tables
  let result = preprocessRepairLatex(text);
  result = preprocessMarkdownTables(result);

  // Step 1: Handle set notation (\{ and \})
  result = preprocessSetNotation(result);

  // Step 2: Strip \left / \right / spacing commands
  result = stripLatexSpacing(result);

  // Step 3: Extract delimited math into placeholder tokens so we can preserve
  //         the original LaTeX for the OMML export path while the rest of the
  //         pipeline continues to fall back to Unicode/HTML for the browser.
  const mathBlocks: { latex: string; display: boolean }[] = [];
  const stash = (latex: string, display: boolean): string => {
    const idx = mathBlocks.length;
    mathBlocks.push({ latex: latex.trim(), display });
    return `\uE000MATH${idx}\uE001`;
  };
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => stash(m, true));
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => stash(m, true));
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => stash(m, false));
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, m) => stash(m, false));

  // Step 4: Fractions with nested braces
  result = preprocessFractionsAdvanced(result);
  result = preprocessFractionsLegacy(result);

  // Step 5: Sqrt (\sqrt{...})
  result = preprocessSqrt(result);

  // Step 6: Standalone LaTeX commands → Unicode (\int, \sum, \sin, \to, \infty, ...)
  result = preprocessStandaloneLatex(result);

  // Step 7: Special-case limit BEFORE generic sub/sup (keeps "x → 0" together)
  result = applyLimit(result);

  // Step 8: Operators with bounds (∫_a^b, ∑_{i=1}^n, ∏_...)
  result = applyOperatorBounds(result);

  // Step 9: Generic superscript / subscript (globally, not only in $...$)
  result = applyScripts(result);

  // Step 10: Bold + line breaks
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\n/g, '<br/>');

  // Step 11: Rebuild math blocks as OMML markers with a Unicode fallback.
  result = result.replace(/\uE000MATH(\d+)\uE001/g, (_, idx) => {
    const b = mathBlocks[Number(idx)];
    if (!b) return '';
    const fallback = renderMathFallback(b.latex);
    return wrapMathMarker(b.latex, b.display, fallback);
  });

  return result;
};


// Simple math formatter for export mode (Word-compatible, no KaTeX)
export const formatMathTextSimple = (text: unknown): React.ReactNode => {
  if (!text) return '';

  if (Array.isArray(text)) {
    return (
      <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0 }}>
        {text.map((t, i) => (
          <li key={i}>{formatMathTextSimple(t)}</li>
        ))}
      </ul>
    );
  }

  if (typeof text === 'object' && text !== null) {
    return (
      <div style={{ paddingLeft: '8px' }}>
        {Object.entries(text).map(([k, v], i) => (
          <div key={i} style={{ marginBottom: '4px' }}>
            <strong>{k.replace(/_/g, ' ')}: </strong>
            {formatMathTextSimple(v)}
          </div>
        ))}
      </div>
    );
  }

  const renderedContent = processContentSimple(String(text));
  return <span dangerouslySetInnerHTML={{ __html: renderedContent }} />;
};
