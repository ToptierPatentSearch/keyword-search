# Patent Keyword Extractor

A browser app for extracting technical keywords from patent text using the OpenAI GPT-5.5 API and suggesting CPC/IPC-like technology clusters.

## Features

- Upload or paste patent text
- Parse text with GPT-5.5 using a strict structured-output schema for consistently formatted keywords
- Extract ranked technical keywords with evidence snippets
- Suggest CPC/IPC-like clusters with confidence labels
- Switch between English and Japanese mode
- Download the current analysis as a PDF report

## Use

Open `index.html` in a browser, enter an OpenAI API key in the API key field, and click **Extract keywords**. The key is stored only in the current browser's local storage.

> Note: This is a static local demo. For production use, proxy OpenAI API calls through your own backend so API keys are not exposed in browser code.
