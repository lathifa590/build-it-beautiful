import React from 'react';
import { wrapMathMarker as _mathMarker } from '@/lib/math-omml';


type RichTextValue = string | string[] | Record<string, unknown> | unknown;

/**
 * Parse markdown table format and convert to HTML table
 * Detects patterns like:
 * | Header 1 | Header 2 |
 * |----------|----------|
 * | Cell 1   | Cell 2   |
 */
export const parseMarkdownTable = (text: string): React.ReactNode | null => {
  if (!text || typeof text !== 'string') return null;
  
  const lines = text.trim().split('\n');
  const tablePattern = /^\|.*\|$/;
  const separatorPattern = /^\|[\s\-:|]+\|$/;
  
  // Check if text contains a markdown table
  const tableLines = lines.filter(line => tablePattern.test(line.trim()));
  if (tableLines.length < 2) return null;
  
  // Check for separator row (required for markdown tables)
  const hasSeparator = lines.some(line => separatorPattern.test(line.trim()));
  if (!hasSeparator) return null;
  
  // Parse into rows
  const rows: string[][] = [];
  let foundSeparator = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip separator row
    if (separatorPattern.test(trimmedLine)) {
      foundSeparator = true;
      continue;
    }
    
    // Parse table row
    if (tablePattern.test(trimmedLine)) {
      const cells = trimmedLine
        .split('|')
        .slice(1, -1) // Remove empty first/last elements
        .map(c => c.trim());
      rows.push(cells);
    }
  }
  
  if (rows.length === 0) return null;
  
  // First row is header, rest are body
  const headerRow = rows[0];
  const bodyRows = rows.slice(1);
  
  return (
    <table style={{ 
      width: '100%', 
      borderCollapse: 'collapse', 
      border: '1px solid black', 
      marginBottom: '12px' 
    }}>
      <thead>
        <tr style={{ backgroundColor: '#f1f5f9' }}>
          {headerRow.map((cell, i) => (
            <th key={i} style={{ 
              border: '1px solid black', 
              padding: '8px', 
              fontWeight: 'bold',
              textAlign: 'left'
            }}>
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bodyRows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} style={{ 
                border: '1px solid black', 
                padding: '8px' 
              }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * Render instruksi yang mungkin mengandung markdown table
 * Memisahkan teks biasa dari tabel dan render keduanya
 */
export const renderInstruksiWithTable = (
  text: string, 
  mathFormatter: (s: string) => React.ReactNode
): React.ReactNode => {
  if (!text || typeof text !== 'string') return null;
  
  const lines = text.split('\n');
  const tablePattern = /^\|.*\|$/;
  // More tolerant separator pattern - allows various separator formats
  const separatorPattern = /^\|[\s\-:|\s]+\|$/;
  
  const result: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let tableLines: string[] = [];
  let inTable = false;
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join('\n').trim();
      if (paragraphText) {
        result.push(
          <p key={`p-${result.length}`} style={{ marginBottom: '12px' }}>
            {mathFormatter(paragraphText)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };
  
  const flushTable = () => {
    if (tableLines.length > 0) {
      const tableNode = parseMarkdownTable(tableLines.join('\n'));
      if (tableNode) {
        result.push(<React.Fragment key={`t-${result.length}`}>{tableNode}</React.Fragment>);
      }
      tableLines = [];
    }
  };
  
  for (const line of lines) {
    const trimmed = line.trim();
    const isTableRow = tablePattern.test(trimmed);
    const isSeparator = separatorPattern.test(trimmed);
    
    if (isTableRow || isSeparator) {
      // Entering or continuing table
      if (!inTable) {
        flushParagraph();
        inTable = true;
      }
      tableLines.push(line);
    } else {
      // Regular text
      if (inTable) {
        flushTable();
        inTable = false;
      }
      currentParagraph.push(line);
    }
  }
  
  // Flush remaining content
  if (inTable) {
    flushTable();
  } else {
    flushParagraph();
  }
  
  return result.length > 0 ? <>{result}</> : null;
};

export const formatRichText = (text: RichTextValue): React.ReactNode => {
  if (!text) return '';

  if (Array.isArray(text)) {
    return (
      <ul className="list-disc pl-5 m-0">
        {text.map((t, i) => (
          <li key={i}>{formatRichText(t)}</li>
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
            {formatRichText(v as RichTextValue)}
          </div>
        ))}
      </div>
    );
  }

  let c = String(text);
  // Normalize literal escape sequences that may survive JSON parsing
  c = c.replace(/\\n/g, '\n');
  c = c.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  // Convert double newlines into paragraph breaks (visible gap), single newlines into <br/>
  c = c.replace(/\n{2,}/g, '</p><p style="margin:6px 0">').replace(/\n/g, '<br/>');
  if (c.includes('</p><p')) {
    c = '<p style="margin:6px 0">' + c + '</p>';
  }

  // Convert text math to proper format
  // sqrt(x) → √x with overline
  c = c.replace(/sqrt\(([^)]+)\)/gi, '√<span style="text-decoration: overline;">$1</span>');

  // Handle fractions: \frac{a}{b} → styled fraction
  c = c.replace(
    /\\frac\{([^{}]+)\}\{([^{}]+)\}/g,
    '<span style="display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; font-size: 0.85em; margin: 0 3px; line-height: 1.2;"><span style="border-bottom: 1px solid currentColor; padding: 0 3px;">$1</span><span style="padding: 0 3px;">$2</span></span>'
  );

  // Handle simple numeric fractions like 1/2, 3/4
  c = c.replace(
    /(\d+)\/(\d+)/g,
    '<span style="display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; font-size: 0.85em; margin: 0 3px; line-height: 1.2;"><span style="border-bottom: 1px solid currentColor; padding: 0 3px;">$1</span><span style="padding: 0 3px;">$2</span></span>'
  );

  // LaTeX sqrt: \sqrt{x} → √x with overline
  c = c.replace(/\\sqrt\{([^{}]+)\}/g, '√<span style="text-decoration: overline;">$1</span>');

  // Unicode superscript mapping for exponents
  const superscriptMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ',
  };

  const subscriptMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ',
  };

  // Convert to Unicode superscripts
  const toSuperscript = (str: string): string => {
    return str.split('').map(char => superscriptMap[char] || char).join('');
  };

  const toSubscript = (str: string): string => {
    return str.split('').map(char => subscriptMap[char] || char).join('');
  };

  // Handle exponents with braces: x^{-2} or x^{2n}
  c = c.replace(/\^\{([^{}]+)\}/g, (_, exp) => toSuperscript(exp));

  // Handle exponents with parentheses: 2^(-2)
  c = c.replace(/\^\(([^)]+)\)/g, (_, exp) => toSuperscript(exp));

  // Handle simple exponents: x^2, 2^3
  c = c.replace(/\^([0-9a-zA-Z\-\+]+)/g, (_, exp) => toSuperscript(exp));

  // Handle subscripts with braces: x_{12}
  c = c.replace(/_\{([^{}]+)\}/g, (_, sub) => toSubscript(sub));

  // Handle simple subscripts: x_1, H_2O
  c = c.replace(/_([0-9a-zA-Z]+)/g, (_, sub) => toSubscript(sub));

  // Math symbols - Use single backslash pattern (escaped in string)
  const symbols: Record<string, string> = {
    '\\times': '×',
    '\\div': '÷',
    '\\cdot': '⋅',
    '\\pm': '±',
    '\\approx': '≈',
    '\\neq': '≠',
    '\\leq': '≤',
    '\\geq': '≥',
    '\\rightarrow': '→',
    '\\leftarrow': '←',
    '\\deg': '°',
    '\\infty': '∞',
    '\\pi': 'π',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\theta': 'θ',
    '\\Delta': 'Δ',
    '\\Omega': 'Ω',
    '\\sum': '∑',
    '\\prod': '∏',
    '\\int': '∫',
    '\\partial': '∂',
    '\\nabla': '∇',
    '\\forall': '∀',
    '\\exists': '∃',
    '\\in': '∈',
    '\\notin': '∉',
    '\\subset': '⊂',
    '\\supset': '⊃',
    '\\cup': '∪',
    '\\cap': '∩',
  };

  for (const [key, val] of Object.entries(symbols)) {
    // Escape special regex chars in key (backslash)
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    c = c.replace(new RegExp(escaped, 'g'), val);
  }

  // Clean up LaTeX delimiters
  c = c
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/\\\(/g, '')
    .replace(/\\\)/g, '')
    .replace(/\\\[/g, '')
    .replace(/\\\]/g, '');

  return <span dangerouslySetInnerHTML={{ __html: c }} />;
};

/**
 * Format text containing math symbols and HTML.
 * Returns raw HTML string (not ReactNode) for use with dangerouslySetInnerHTML.
 * This preserves HTML tags like <ul>, <li>, <b> from AI output while also
 * converting LaTeX math symbols to Unicode/HTML.
 */
// Fraction HTML builder
const _fracHtml = (n: string, d: string) =>
  `<span style="display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:0.85em;margin:0 3px;line-height:1.2;"><span style="border-bottom:1px solid currentColor;padding:0 3px;">${n}</span><span style="padding:0 3px;">${d}</span></span>`;

// Match nested braces starting at text[startIndex] === '{'
const _matchBraces = (text: string, startIndex: number): { content: string; endIndex: number } | null => {
  if (text[startIndex] !== '{') return null;
  let depth = 1, i = startIndex + 1;
  while (i < text.length && depth > 0) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    i++;
  }
  if (depth !== 0) return null;
  return { content: text.substring(startIndex + 1, i - 1), endIndex: i };
};

// Recursively convert \frac{...}{...} with nested-brace support
const _convertFractions = (text: string): string => {
  let out = '', i = 0;
  while (i < text.length) {
    if (text.substring(i, i + 6) === '\\frac{') {
      const num = _matchBraces(text, i + 5);
      if (num) {
        const den = _matchBraces(text, num.endIndex);
        if (den) {
          out += _fracHtml(_convertFractions(num.content), _convertFractions(den.content));
          i = den.endIndex;
          continue;
        }
      }
    }
    out += text[i];
    i++;
  }
  return out;
};

// Recursively convert \sqrt{...}
const _convertSqrt = (text: string): string => {
  let out = '', i = 0;
  while (i < text.length) {
    if (text.substring(i, i + 6) === '\\sqrt{') {
      const m = _matchBraces(text, i + 5);
      if (m) {
        out += `√<span style="text-decoration:overline;">${_convertSqrt(m.content)}</span>`;
        i = m.endIndex;
        continue;
      }
    }
    out += text[i];
    i++;
  }
  return out;
};

// Repair LaTeX corrupted by JSON.parse (\\f → form-feed, \\t → TAB, etc.)
const _repairLatex = (text: string): string => {
  let r = text;
  // TAB between math-ish chars almost always = broken \to
  r = r.replace(/([A-Za-z0-9}\)])\t+([A-Za-z0-9{\(])/g, '$1 \\to $2');
  r = r.replace(/\t/g, ' ');
  // Fix " o " → " \to " inside lim subscript
  r = r.replace(/(\\?lim_\{)([^}]*)\}/gi, (_, head, inner) =>
    `${head}${inner.replace(/\s+o\s+/g, ' \\to ')}}`,
  );
  // Restore missing backslash on common funcs followed by _ or {
  r = r.replace(
    /(^|[\s\(\[\{=+\-*/,])(lim|sin|cos|tan|sec|csc|cot|log|ln|sqrt|frac)([_{])/g,
    '$1\\$2$3',
  );
  // Broken \frac where backslash became form-feed/replacement char/▲
  r = r.replace(/[\x0C\uFFFD▲](?=rac\{)/g, '\\');
  // Literal "frac{...}{...}" without backslash
  r = r.replace(/(?<![\\a-zA-Z])frac(?=\{)/g, '\\frac');
  return r;
};

// Convert standalone LaTeX commands to Unicode
const _latexToUnicode: Record<string, string> = {
  '\\rightarrow': '→', '\\leftarrow': '←', '\\to': '→', '\\gets': '←',
  '\\mapsto': '↦', '\\Rightarrow': '⇒', '\\Leftarrow': '⇐',
  '\\leftrightarrow': '↔', '\\Leftrightarrow': '⇔',
  '\\uparrow': '↑', '\\downarrow': '↓',
  '\\times': '×', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
  '\\cdot': '⋅', '\\ast': '∗', '\\star': '⋆', '\\circ': '∘',
  '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈',
  '\\equiv': '≡', '\\sim': '∼', '\\cong': '≅', '\\propto': '∝',
  '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
  '\\epsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ',
  '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\mu': 'μ',
  '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π', '\\rho': 'ρ',
  '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ',
  '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
  '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ',
  '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Upsilon': 'Υ',
  '\\Phi': 'Φ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
  '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃',
  '\\subseteq': '⊆', '\\supseteq': '⊇', '\\cup': '∪', '\\cap': '∩',
  '\\emptyset': '∅', '\\varnothing': '∅',
  '\\forall': '∀', '\\exists': '∃', '\\neg': '¬', '\\land': '∧',
  '\\lor': '∨', '\\therefore': '∴', '\\because': '∵',
  '\\infty': '∞', '\\partial': '∂', '\\nabla': '∇',
  '\\sum': '∑', '\\prod': '∏', '\\int': '∫', '\\deg': '°',
  '\\angle': '∠', '\\perp': '⊥', '\\parallel': '∥',
  '\\dots': '…', '\\ldots': '…', '\\cdots': '⋯', '\\vdots': '⋮', '\\ddots': '⋱',
  '\\arcsin': 'arcsin', '\\arccos': 'arccos', '\\arctan': 'arctan',
  '\\sinh': 'sinh', '\\cosh': 'cosh', '\\tanh': 'tanh',
  '\\sin': 'sin', '\\cos': 'cos', '\\tan': 'tan',
  '\\sec': 'sec', '\\csc': 'csc', '\\cot': 'cot',
  '\\log': 'log', '\\ln': 'ln', '\\lim': 'lim',
  '\\max': 'max', '\\min': 'min',
};

const _convertLatexCommands = (text: string): string => {
  let r = text;
  const keys = Object.keys(_latexToUnicode).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const esc = k.replace(/\\/g, '\\\\');
    r = r.replace(new RegExp(esc, 'g'), _latexToUnicode[k]);
  }
  return r;
};

export const formatMathAndHtml = (text: string | undefined | null): string => {
  if (!text) return '';

  let c = String(text);

  // Step 0: repair LaTeX corrupted by JSON.parse
  c = _repairLatex(c);

  // Step 1: process markdown bold/italic before HTML manipulation
  c = c.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  c = c.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<i>$1</i>');

  // Step 2: extract delimited math into placeholder tokens so the OMML export
  //         pipeline can recover the original LaTeX. Non-delimited LaTeX
  //         fragments are still handled by the Unicode fallback below.
  const mathBlocks: { latex: string; display: boolean }[] = [];
  const stash = (latex: string, display: boolean): string => {
    const idx = mathBlocks.length;
    mathBlocks.push({ latex: latex.trim(), display });
    return `\uE000MATH${idx}\uE001`;
  };
  c = c.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => stash(m, true));
  c = c.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => stash(m, true));
  c = c.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => stash(m, false));
  c = c.replace(/\$([^\$\n]+?)\$/g, (_, m) => stash(m, false));

  // Step 3: fractions (nested-brace aware) on remaining non-delimited text
  c = _convertFractions(c);
  // legacy/broken patterns
  c = c.replace(/[\x0C\uFFFD▲]rac\{([^{}]+)\}\{([^{}]+)\}/g, (_, n, d) => _fracHtml(n, d));

  // Step 4: sqrt (nested)
  c = _convertSqrt(c);
  c = c.replace(/sqrt\(([^)]+)\)/gi, '√<span style="text-decoration:overline;">$1</span>');

  // Step 5: standalone LaTeX commands → Unicode
  c = _convertLatexCommands(c);

  // Step 6: superscripts ^{...} / ^(...) / ^x
  const supMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', 'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ',
  };
  const toSup = (s: string) => s.split('').map(ch => supMap[ch] || ch).join('');
  c = c.replace(/\^\{([^{}]+)\}/g, (_, e) => toSup(e));
  c = c.replace(/\^\(([^)]+)\)/g, (_, e) => toSup(e));
  c = c.replace(/\^([0-9a-zA-Z\-\+]+)/g, (_, e) => toSup(e));

  // Step 7: subscripts
  const subMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ',
  };
  const toSub = (s: string) => s.split('').map(ch => subMap[ch] || ch).join('');
  c = c.replace(/_\{([^{}]+)\}/g, (_, s) => toSub(s));
  c = c.replace(/_([0-9a-zA-Z]+)/g, (_, s) => toSub(s));

  // Step 8: simple numeric fractions a/b
  c = c.replace(/(\d+)\/(\d+)/g, (_, n, d) => _fracHtml(n, d));

  // Step 9: newlines
  c = c.replace(/\n/g, '<br/>');

  // Step 10: rebuild delimited math as OMML markers with a Unicode fallback.
  c = c.replace(/\uE000MATH(\d+)\uE001/g, (_, idx) => {
    const block = mathBlocks[Number(idx)];
    if (!block) return '';
    // Build a Unicode/HTML fallback by running the same conversions on the
    // inner LaTeX (skipping the delimiter step which no longer applies).
    let fb = block.latex;
    fb = _convertFractions(fb);
    fb = _convertSqrt(fb);
    fb = _convertLatexCommands(fb);
    fb = fb.replace(/\^\{([^{}]+)\}/g, (_, e) => toSup(e));
    fb = fb.replace(/\^\(([^)]+)\)/g, (_, e) => toSup(e));
    fb = fb.replace(/\^([0-9a-zA-Z\-\+]+)/g, (_, e) => toSup(e));
    fb = fb.replace(/_\{([^{}]+)\}/g, (_, s) => toSub(s));
    fb = fb.replace(/_([0-9a-zA-Z]+)/g, (_, s) => toSub(s));
    return _mathMarker(block.latex, block.display, fb);
  });

  return c;
};


export const cleanJson = <T,>(text: string | null | undefined): T | null => {
  if (!text) return null;

  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const s = cleaned.indexOf('{');
  const e = cleaned.lastIndexOf('}');

  if (s !== -1 && e !== -1) {
    cleaned = cleaned.substring(s, e + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    try {
      return JSON.parse(cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '')) as T;
    } catch {
      return null;
    }
  }
};
