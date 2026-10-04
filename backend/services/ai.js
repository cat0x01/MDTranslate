import OpenAI from "openai";
import { translate as googleTranslate } from "@vitalets/google-translate-api";
import { translate as bingTranslate } from "bing-translate-api";
import { parseMarkdown, sha256, stringifyMarkdown } from "../utils/parser.js";
import { visitParents } from "unist-util-visit-parents";

export const SYSTEM_PROMPT = `You are a professional translator.
Translate the given Markdown content into Arabic.

Rules:
- Keep Markdown syntax EXACTLY the same
- Do NOT translate code blocks or inline code
- Do NOT modify links or images
- Translate text naturally, not literally
- Keep formatting clean and readable
- Maintain headings structure
- Keep technical terms if needed (do not over-translate)

Return ONLY valid Markdown.`;

const cache = new Map();
const TOKEN_PATTERN = /(MDTRANSLATETOKEN\d+X\d+)/g;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for real translation.");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined
  });
}

function hasOpenAiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key && key !== "sk-your-key");
}

export function getTranslationProviderId() {
  const provider = process.env.TRANSLATION_PROVIDER?.trim().toLowerCase();
  if (provider === "module") return "module:keyless";
  if (provider === "openai") return `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}`;
  return hasOpenAiKey() ? `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}` : "module:keyless";
}

function shouldUseOpenAi() {
  const provider = process.env.TRANSLATION_PROVIDER?.trim().toLowerCase();
  if (provider === "module") return false;
  if (provider === "openai") return true;
  return hasOpenAiKey();
}

function hasMeaningfulText(value) {
  return /[\p{L}\p{N}]/u.test(value.replace(/MDTRANSLATETOKEN\d+X\d+/g, ""));
}

function withOriginalPadding(original, translated) {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated.trim()}${trailing}`;
}

function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} translation timed out.`)), 12_000);
    })
  ]);
}

async function translateWithKeylessModules(value) {
  const errors = [];

  try {
    const response = await withTimeout(googleTranslate(value, { to: "ar" }), "Google module");
    return response.text;
  } catch (error) {
    errors.push(error);
  }

  try {
    const response = await withTimeout(bingTranslate(value, null, "ar"), "Bing module");
    return response.translation;
  } catch (error) {
    errors.push(error);
  }

  throw new Error(`Keyless translation modules failed: ${errors.map((error) => error.message).join(" ")}`);
}

async function translatePlainText(value) {
  const pieces = value.split(TOKEN_PATTERN);
  const translated = [];

  for (const piece of pieces) {
    TOKEN_PATTERN.lastIndex = 0;
    if (!piece || TOKEN_PATTERN.test(piece) || !hasMeaningfulText(piece)) {
      translated.push(piece);
      continue;
    }

    const response = await translateWithKeylessModules(piece);
    translated.push(withOriginalPadding(piece, response));
  }

  return translated.join("");
}

async function translateMarkdownWithModule(markdown) {
  const tree = parseMarkdown(markdown);
  const textNodes = [];

  visitParents(tree, (node) => {
    if (node.type === "text" && hasMeaningfulText(node.value ?? "")) {
      textNodes.push(node);
    }
  });

  for (const node of textNodes) {
    node.value = await translatePlainText(node.value);
  }

  return stringifyMarkdown(tree).trim();
}

async function translateWithOpenAi(blocks) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const client = getClient();

  const translated = [];
  for (const block of blocks) {
    const key = sha256(`${model}:${block.hash}:${block.markdown}`);
    if (cache.has(key)) {
      translated.push({ ...block, markdown: cache.get(key) });
      continue;
    }

    const response = await client.chat.completions.create({
      model,
      temperature: 0.25,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: block.markdown }
      ]
    });

    const markdown = response.choices?.[0]?.message?.content?.trim();
    if (!markdown) throw new Error("The AI provider returned an empty translation.");

    cache.set(key, markdown);
    translated.push({ ...block, markdown });
  }

  return translated;
}

async function translateWithModule(blocks) {
  const provider = getTranslationProviderId();
  const translated = [];

  for (const block of blocks) {
    const key = sha256(`${provider}:${block.hash}:${block.markdown}`);
    if (cache.has(key)) {
      translated.push({ ...block, markdown: cache.get(key) });
      continue;
    }

    const markdown = await translateMarkdownWithModule(block.markdown);
    if (!markdown) throw new Error("The module translator returned an empty translation.");

    cache.set(key, markdown);
    translated.push({ ...block, markdown });
  }

  return translated;
}

export async function translateBlocks(blocks) {
  return shouldUseOpenAi() ? translateWithOpenAi(blocks) : translateWithModule(blocks);
}
