# Patent Keyword Extractor

A browser app for extracting technical keywords from patent text and suggesting CPC/IPC-like technology clusters.

## Features

- Upload or paste patent text
- Extract ranked technical keywords with evidence snippets
- Use the Supabase Edge Function `openai-proxy` for GPT-powered parsing without exposing the GPT API key in the browser
- Fall back to the built-in local parser if the Edge Function is unavailable or returns an invalid response
- Suggest CPC/IPC-like clusters with confidence labels
- Switch between English and Japanese mode
- Download the current analysis as a PDF report

## Use

Open `index.html` in a browser. Click **Extract keywords** after entering patent text.

The GPT API key must be stored server-side in the Supabase Edge Function; the client only calls:

```text
https://xokeajplozstmjpuigia.supabase.co/functions/v1/openai-proxy
```

The Edge Function should accept JSON containing `language`, `text`, and `prompt`, call GPT using its stored API key, and return either the requested JSON analysis directly or a standard GPT response whose message content contains that JSON.
