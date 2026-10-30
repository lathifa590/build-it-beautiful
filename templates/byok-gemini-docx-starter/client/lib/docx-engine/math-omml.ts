import JSZip from 'jszip';
import temml from 'temml';
import { mml2omml } from 'mathml2omml';

const MATH_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';

/**
 * Converts a raw LaTeX string into an Office Open XML Math (OMML) XML snippet.
 */
export function latexToOmml(latex: string, isDisplayMode: boolean = false): string | null {
  try {
    const mathml = temml.renderToString(latex, {
      displayMode: isDisplayMode,
      throwOnError: false,
      annotate: false,
      xml: true,
    });

    if (!mathml) return null;
    let omml = mml2omml(mathml);
    if (!omml) return null;

    if (!/xmlns:m=/.test(omml)) {
      omml = omml.replace(/^<m:oMath\b/, `<m:oMath xmlns:m="${MATH_NS}"`);
    }

    if (isDisplayMode) {
      omml = `<m:oMathPara xmlns:m="${MATH_NS}">${omml}</m:oMathPara>`;
    }

    return omml;
  } catch (err) {
    console.warn('[math-omml] latexToOmml failed for:', latex, err);
    return null;
  }
}

/**
 * Post-processes a generated docx Blob by replacing unique placeholder markers
 * (e.g. `__MATH_0__`, `__MATH_1__`) with proper OOXML `<m:oMath>` nodes.
 *
 * @param docxBlob The raw .docx blob produced by `Packer.toBlob(doc)`
 * @param mathMap Map of placeholder marker string to its OMML XML string
 * @returns A new .docx Blob with valid native Word math formulas
 */
export async function injectOmmlIntoDocx(
  docxBlob: Blob,
  mathMap: Map<string, string>
): Promise<Blob> {
  if (mathMap.size === 0) return docxBlob;

  const zip = await JSZip.loadAsync(docxBlob);
  const documentXmlFile = zip.file('word/document.xml');

  if (!documentXmlFile) {
    console.warn('[math-omml] word/document.xml not found in zip.');
    return docxBlob;
  }

  let xml = await documentXmlFile.async('string');

  // Ensure xmlns:m is declared on <w:document>
  if (!xml.includes('xmlns:m=')) {
    xml = xml.replace(
      '<w:document',
      `<w:document xmlns:m="${MATH_NS}"`
    );
  }

  // Replace each marker run with its equivalent OMML fragment
  for (const [marker, omml] of mathMap.entries()) {
    // Match the surrounding <w:r> containing the marker
    const runRegex = new RegExp(
      `<w:r\\b[^>]*>(?:(?!<\\/w:r>).)*?${marker}.*?<\\/w:r>`,
      'gs'
    );
    xml = xml.replace(runRegex, omml);
  }

  zip.file('word/document.xml', xml);
  return await zip.generateAsync({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}
