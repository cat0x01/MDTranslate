import crypto from "node:crypto";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { visitParents } from "unist-util-visit-parents";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkStringify, {
    bullet: "-",
    fences: true,
    rule: "-",
    listItemIndent: "one"
  });

const PROTECTED_INLINE = new Set(["inlineCode", "link", "image", "html", "break"]);
const TRANSLATABLE = new Set(["paragraph", "heading"]);

function hasTranslatableText(node) {
  if (PROTECTED_INLINE.has(node.type)) return false;
  if (node.type === "text") return Boolean(node.value?.trim());
  return Boolean(node.children?.some(hasTranslatableText));
}

function shouldTranslateNode(node, ancestors) {
  if (!TRANSLATABLE.has(node.type)) return false;
  if (ancestors.some((parent) => ["link", "image", "table", "code", "inlineCode"].includes(parent.type))) return false;
  return hasTranslatableText(node);
}

export function parseMarkdown(markdown) {
  return processor.parse(markdown);
}

export function stringifyMarkdown(tree) {
  return processor.stringify(tree);
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function getTranslationBlocks(markdown) {
  const tree = parseMarkdown(markdown);
  const blocks = [];

  visitParents(tree, (node, ancestors) => {
    if (!shouldTranslateNode(node, ancestors)) return;

    const protectedValues = new Map();
    const cloned = structuredClone(node);
    let index = 0;

    visitParents(cloned, (child, parents) => {
      if (!PROTECTED_INLINE.has(child.type)) return;
      const parent = parents.at(-1);
      if (!parent?.children) return;
      const token = `MDTRANSLATETOKEN${blocks.length}X${index++}`;
      protectedValues.set(token, processor.stringify({ type: "root", children: [child] }).trim());
      const childIndex = parent.children.indexOf(child);
      parent.children.splice(childIndex, 1, { type: "text", value: token });
    });

    blocks.push({
      id: blocks.length,
      type: node.type,
      hash: sha256(processor.stringify({ type: "root", children: [cloned] })),
      markdown: processor.stringify({ type: "root", children: [cloned] }).trim(),
      protectedValues: Object.fromEntries(protectedValues)
    });
  });

  return { tree, blocks };
}

export function restoreProtected(markdown, protectedValues) {
  return Object.entries(protectedValues).reduce(
    (output, [token, value]) => output.replaceAll(token, value),
    markdown
  );
}

export function applyTranslations(markdown, translatedBlocks) {
  const tree = parseMarkdown(markdown);
  const replacements = [];
  let cursor = 0;

  visitParents(tree, (node, ancestors) => {
    if (!shouldTranslateNode(node, ancestors)) return;

    const translated = translatedBlocks[cursor++];
    if (!translated?.markdown) return;

    const start = node.position?.start?.offset;
    const end = node.position?.end?.offset;
    if (typeof start !== "number" || typeof end !== "number") return;

    replacements.push({
      start,
      end,
      value: restoreProtected(translated.markdown, translated.protectedValues ?? {}).trim()
    });
  });

  return replacements
    .sort((a, b) => b.start - a.start)
    .reduce((output, replacement) => {
      return `${output.slice(0, replacement.start)}${replacement.value}${output.slice(replacement.end)}`;
    }, markdown);
}
