# Patent Keyword Extractor

A local browser app for extracting technical keywords from patent text and suggesting CPC/IPC-like technology clusters.

## Features

- Upload or paste patent text
- Extract ranked technical keywords with evidence snippets
- Use a GPT-5.5 parsing profile with section-aware weighting, phrase extraction, and technical suffix detection
- Suggest CPC/IPC-like clusters with confidence labels
- Switch between English and Japanese mode
- Download the current analysis as a PDF report

## Use

Open `index.html` in a browser. The app runs entirely client-side. The GPT-5.5 parsing profile is a local heuristic profile; it does not send text to an external model or API.
