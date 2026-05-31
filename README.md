# Patent Keyword Extractor

A local browser app for extracting technical keywords from patent text and suggesting CPC/IPC-like technology clusters.

## Features

- Upload or paste patent text
- Extract ranked technical keywords with evidence snippets
- Suggest CPC/IPC-like clusters with confidence labels
- Switch between English and Japanese mode
- Download the current analysis as a PDF report

## Use

Open `index.html` in a browser. Keyword rendering runs in the browser; AI parsing is requested through the Supabase Edge Function so API keys stay server-side.


## Supabase Edge Function setup

The browser app calls `supabase/functions/openai-proxy` for AI parsing so the GPT/OpenAI API key is kept in Supabase, not in client-side JavaScript.

1. Store the API key as a Supabase secret named `GPTAPI` (or `OPENAI_API_KEY`).
2. Deploy the function in `supabase/functions/openai-proxy`; `supabase/config.toml` disables JWT verification for this public browser endpoint.
3. Optional: set `OPENAI_MODEL` to override the default model used by the function.

If the Edge Function is unavailable, the app falls back to the local keyword extractor instead of displaying raw proxy JSON.
