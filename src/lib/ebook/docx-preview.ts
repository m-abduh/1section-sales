import JSZip from "jszip";

const PAGEREF_RUN = new RegExp(
  String.raw`<w:r>` +
    String.raw`(?:(?!<\/w:r>)[\s\S])*?` +
    String.raw`<w:fldChar([^>]*w:fldCharType="begin"[^>]*)\/>` +
    String.raw`(?:(?!<\/w:r>)[\s\S])*?` +
    String.raw`<w:instrText([^>]*)>(PAGEREF\b[\s\S]*?)<\/w:instrText>` +
    String.raw`(?:(?!<\/w:r>)[\s\S])*?` +
    String.raw`<w:fldChar([^>]*w:fldCharType="separate"[^>]*)\/>` +
    String.raw`((?:(?!<\/w:r>)[\s\S])*?)` +
    String.raw`<w:fldChar([^>]*w:fldCharType="end"[^>]*)\/>` +
    String.raw`<\/w:r>`,
  "g",
);

/**
 * docx-preview hides any run that carries field characters, including the
 * cached result of a PAGEREF field. Word stores the page reference result in
 * the same run as the field markers, so the TOC page numbers disappear in the
 * browser preview. This splits each PAGEREF field into individual runs so the
 * cached result renders, without changing styles, spacing, or TOC levels.
 */
export async function prepareDocxForPreview(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = zip.file("word/document.xml");
  if (!documentXml) return buffer;

  const xml = await documentXml.async("string");
  let replaced = 0;
  const patched = xml.replace(
    PAGEREF_RUN,
    (
      _match,
      beginAttributes: string,
      instrAttributes: string,
      instruction: string,
      separateAttributes: string,
      result: string,
      endAttributes: string,
    ) => {
      replaced += 1;
      return (
        `<w:r><w:fldChar${beginAttributes}/></w:r>` +
        `<w:r><w:instrText${instrAttributes}>${instruction}</w:instrText></w:r>` +
        `<w:r><w:fldChar${separateAttributes}/></w:r>` +
        `<w:r>${result}</w:r>` +
        `<w:r><w:fldChar${endAttributes}/></w:r>`
      );
    },
  );

  if (replaced === 0) return buffer;

  zip.file("word/document.xml", patched);
  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
}
