# MDTranslate AI

A local app that translates Markdown files into Arabic.

## Setup

```bash
npm install
cp backend/.env.example backend/.env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

By default, the app uses Google Translate without an API key. To use an OpenAI-compatible provider, set these values in `backend/.env`:

```env
TRANSLATION_PROVIDER=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

## Limits

- Only `.md` files up to 2 MB are supported.
- Code, links, images, tables, and Markdown formatting are preserved.
- Translation history is saved in the browser.
