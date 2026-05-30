# Patent Keyword Extractor

A local browser app for extracting technical keywords from patent text and suggesting CPC/IPC-like technology clusters.

## Features

- Upload or paste patent text
- Extract ranked technical keywords with evidence snippets
- Use a local GPT-5.5 optimized parser profile that weights section context, claim language, phrase specificity, and technical-domain signals
- Suggest CPC/IPC-like clusters with confidence labels
- Switch between English and Japanese mode
- Download the current analysis as a PDF report

## Use

Open `index.html` in a browser. The app runs entirely client-side. The GPT-5.5 optimized parser is a local scoring profile; it does not call an external model or API.
