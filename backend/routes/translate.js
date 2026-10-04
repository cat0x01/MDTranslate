import express from "express";
import multer from "multer";
import { applyTranslations, getTranslationBlocks, sha256 } from "../utils/parser.js";
import { getTranslationProviderId, translateBlocks } from "../services/ai.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.originalname.toLowerCase().endsWith(".md")) {
      cb(new Error("Only .md files are accepted."));
      return;
    }
    cb(null, true);
  }
});

const documentCache = new Map();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "MDTranslate AI backend" });
});

router.post("/translate", upload.single("file"), async (req, res, next) => {
  try {
    const markdown = req.file ? req.file.buffer.toString("utf8") : req.body?.markdown;
    if (!markdown || typeof markdown !== "string") {
      res.status(400).json({ error: "Upload a Markdown file or provide markdown text." });
      return;
    }

    if (Buffer.byteLength(markdown, "utf8") > 2 * 1024 * 1024) {
      res.status(413).json({ error: "Markdown must be 2MB or smaller." });
      return;
    }

    const cacheKey = sha256(`${getTranslationProviderId()}:${markdown}`);
    if (documentCache.has(cacheKey)) {
      res.json(documentCache.get(cacheKey));
      return;
    }

    const { blocks } = getTranslationBlocks(markdown);
    const translatedBlocks = await translateBlocks(blocks);
    const translatedMarkdown = applyTranslations(markdown, translatedBlocks);
    const payload = {
      originalMarkdown: markdown,
      translatedMarkdown,
      blocksTranslated: translatedBlocks.length,
      cached: false
    };

    documentCache.set(cacheKey, { ...payload, cached: true });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
