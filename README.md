# Patent Keyword Extractor

A local browser app for extracting technical keywords from patent text and suggesting CPC/IPC-like technology clusters.

## Features

- Upload or paste patent text, including normalized plain text extracted from pasted HTML or simple RTF files
- Extract ranked technical keywords with evidence snippets using GPT-5.5 when an OpenAI API key is provided, with an offline fallback
- Suggest CPC/IPC-like clusters with confidence labels
- Switch between English and Japanese mode
- Download the current analysis as a PDF report

## Use

Open `index.html` in a browser. Paste an OpenAI API key into the API key field to parse normalized patent text with the GPT-5.5 Responses API; leave it blank to use the built-in offline extractor. The app runs entirely client-side, and the key is stored only in browser session storage.
