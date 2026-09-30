<div align="center">

# 📄 PDF Download Extension

### Chrome extension for discovering and downloading PDF files from the current webpage

A lightweight browser extension built with **React 19, TypeScript, Vite and Manifest V3** that scans the active page for PDF links and lets users download files individually, selectively or in bulk.

<br />

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)

</div>

---

## About the Project

**PDF Download Extension** is a Chrome/Chromium extension designed to find PDF-related links on the currently active webpage.

The extension scans page anchors and checks multiple signals to decide whether a link is likely to represent a PDF.

Detected items are displayed in a popup where users can:

- Download a single PDF
- Select multiple PDFs
- Download selected PDFs
- Download every detected PDF
- Review detected filenames and URLs

---

## Main Features

### PDF Discovery

The extension detects PDF links using multiple signals:

- URL ending in `.pdf`
- URL containing `.pdf?`
- URL containing `.pdf#`
- `type="application/pdf"`
- `download` attribute ending with `.pdf`
- Anchor text containing `pdf`
- `title` attribute containing `pdf`
- `aria-label` containing `pdf`

### Download Options

- Individual download
- Multi-select with checkbox
- Download selected files
- Download all detected files

### Browser Integration

- Manifest V3
- Active tab access
- Content script
- Chrome Downloads API
- Chrome messaging
- `<all_urls>` host permissions

---

## Architecture

```text id="pdf001"
                Browser Tab
                    │
                    ▼
              Content Script
                    │
                    │ Scan <a href>
                    ▼
             PDF Detection Logic
                    │
                    ▼
             Deduplicated Items
                    │
                    │ chrome.runtime messaging
                    ▼
                React Popup
                    │
          ┌─────────┼─────────┐
          │         │         │
          ▼         ▼         ▼
      Download   Selected   Download
       Single     Files       All
                    │
                    ▼
            Chrome Downloads API
```

---

## Tech Stack

| Technology | Purpose |
| --- | --- |
| **React 19.2** | Extension popup UI |
| **TypeScript 5.9** | Type safety |
| **Vite 8** | Build tooling |
| **Manifest V3** | Browser extension architecture |
| **Chrome Tabs API** | Active tab access |
| **Chrome Runtime API** | Popup/content communication |
| **Chrome Downloads API** | File downloads |
| **Content Scripts** | DOM inspection |
| **React Compiler** | React optimization pipeline |
| **ESLint 9** | Static analysis |

---

## Manifest V3

The main extension manifest declares:

```json id="pdf002"
{
  "manifest_version": 3,
  "name": "Page Review",
  "version": "1.0.0"
}
```

The current description is:

```text id="pdf003"
Lists PDF files found on the current page
```

---

## Permissions

The extension currently requests:

```text id="pdf004"
activeTab
downloads
```

and declares:

```text id="pdf005"
<all_urls>
```

as host permission for the content script.

---

## Content Script

The PDF detection logic lives in:

```text id="pdf006"
src/content.ts
```

The script runs against matching pages and waits for messages from the popup.

---

## Popup → Content Script Flow

When the popup opens:

```text id="pdf007"
1. Query active tab
2. Get active tab ID
3. Send GET_PDF_ITEMS message
4. Content script scans the page
5. PDF items are returned
6. Popup renders the result
```

---

## Runtime Message

The popup sends:

```ts id="pdf008"
{
  type: "GET_PDF_ITEMS"
}
```

to the active tab.

The content script responds with:

```ts id="pdf009"
{
  items: PdfItem[]
}
```

---

## PDF Item Model

Detected files use:

```ts id="pdf010"
type PdfItem = {
  url: string;
  name: string;
  type: "pdf";
};
```

---

## PDF URL Detection

Basic URL detection checks:

```ts id="pdf011"
lowerUrl.endsWith(".pdf")
```

as well as:

```text id="pdf012"
.pdf?
.pdf#
```

for URLs containing query strings or fragments.

---

## Smart Link Detection

The extension does not rely only on the URL extension.

A link can also be recognized as a PDF based on:

```text id="pdf013"
href
type
download
visible text
title
aria-label
```

This improves compatibility with links where the actual PDF URL is not obvious from the path.

---

## Detection Logic

The core logic approximately follows:

```text id="pdf014"
Anchor Element
     │
     ├── URL contains .pdf?
     ├── type=application/pdf?
     ├── download filename .pdf?
     ├── text says PDF?
     ├── title says PDF?
     └── aria-label says PDF?
            │
            ▼
         Detected
```

---

## Relative URLs

Links are normalized using:

```ts id="pdf015"
new URL(rawUrl, window.location.href)
```

so relative URLs become absolute before being returned to the popup.

---

## Duplicate Prevention

The scanner uses:

```text id="pdf016"
Set<string>
```

to prevent the same absolute PDF URL from appearing multiple times.

---

## File Name Detection

Display names are resolved in this order:

```text id="pdf017"
download attribute
      ↓
visible anchor text
      ↓
title attribute
      ↓
filename from URL
      ↓
unnamed.pdf
```

---

## Download Attribute

If the source anchor contains:

```html id="pdf018"
<a download="document.pdf">
```

that value becomes the preferred display name.

---

## URL Filename Fallback

When no better name exists, the last pathname segment is used.

For example:

```text id="pdf019"
https://example.com/files/report.pdf
```

becomes:

```text id="pdf020"
report.pdf
```

---

## Safe File Names

Before downloading, the popup sanitizes filenames.

Characters such as:

```text id="pdf021"
< > : " / \ | ? *
```

are replaced with:

```text id="pdf022"
_
```

This helps prevent invalid local file names.

---

## Automatic PDF Extension

If the resolved filename does not end with:

```text id="pdf023"
.pdf
```

the popup automatically appends it before requesting the download.

---

## Individual Download

Every detected item contains a download icon.

Selecting it calls:

```ts id="pdf024"
chrome.downloads.download({
  url: item.url,
  filename: safeName,
  saveAs: false
});
```

---

## Download Selected

Users can select PDFs through checkboxes.

Selected items are stored in React state:

```text id="pdf025"
selectedItems
```

The:

```text id="pdf026"
Download Selected Files
```

button is disabled when no item has been selected.

---

## Download All

The:

```text id="pdf027"
Download All Files
```

action iterates through every detected PDF and invokes the Chrome Downloads API for each item.

---

## Empty State

If the content script finds no matching links, the popup displays:

```text id="pdf028"
No PDF files found on this page.
```

---

## Popup Dimensions

The popup currently uses:

```text id="pdf029"
min-width: 340px
max-width: 420px
```

to keep detected URLs and filenames readable.

---

## React State

The popup uses built-in React state:

```text id="pdf030"
useState
useEffect
```

No Redux or external state-management library is required.

---

## Build Architecture

The Vite configuration defines two build inputs:

```text id="pdf031"
popup
content
```

through:

```ts id="pdf032"
input: {
  popup: resolve(__dirname, "index.html"),
  content: resolve(__dirname, "src/content.ts")
}
```

---

## Stable Content Script Filename

The build configuration intentionally outputs the content script as:

```text id="pdf033"
content.js
```

instead of a hashed filename.

This is required because the extension manifest directly references:

```json id="pdf034"
"js": ["content.js"]
```

---

## Other Build Assets

Non-content entry files continue to use hashed filenames:

```text id="pdf035"
assets/[name]-[hash].js
```

which preserves normal Vite cache-busting behavior.

---

## React Compiler

The project enables the React Compiler through:

```text id="pdf036"
babel-plugin-react-compiler
```

inside Vite.

---

## Extension Icons

The repository contains dedicated Chrome extension icons in:

```text id="pdf037"
public/
```

including:

```text id="pdf038"
icon-16.png
icon-32.png
icon-48.png
icon-128.png
```

These are referenced by the Manifest V3 configuration.

---

## Project Structure

```text id="pdf039"
PDF-Download-Extension/
│
├── public/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   ├── icon-128.png
│   ├── download.png
│   ├── favicon.ico
│   ├── manifest.json
│   └── ...
│
├── src/
│   ├── assets/
│   ├── App.tsx
│   ├── content.ts
│   ├── index.css
│   └── main.tsx
│
├── index.html
├── manifest.json
├── package.json
├── vite.config.ts
├── tsconfig.json
└── eslint.config.js
```

---

## Getting Started

Clone the repository:

```bash id="pdf040"
git clone https://github.com/seyitbugraerden/PDF-Download-Extension.git
```

Navigate into the project:

```bash id="pdf041"
cd PDF-Download-Extension
```

Install dependencies:

```bash id="pdf042"
npm install
```

---

## Development

Start the Vite development environment:

```bash id="pdf043"
npm run dev
```

For actual extension testing, use a production build.

---

## Build

```bash id="pdf044"
npm run build
```

The project performs:

```text id="pdf045"
TypeScript build
+
Vite production build
```

through:

```text id="pdf046"
tsc -b && vite build
```

---

## Install in Chrome

After building:

1. Open:

```text id="pdf047"
chrome://extensions
```

2. Enable:

```text id="pdf048"
Developer mode
```

3. Select:

```text id="pdf049"
Load unpacked
```

4. Choose:

```text id="pdf050"
dist/
```

---

## Usage

1. Open a webpage containing PDF links.
2. Click the extension icon.
3. Wait for detected PDF items to appear.
4. Choose one of the available actions:
   - Download one PDF
   - Select multiple PDFs
   - Download selected files
   - Download all files

---

## Available Scripts

### Development

```bash id="pdf051"
npm run dev
```

### Production Build

```bash id="pdf052"
npm run build
```

### Lint

```bash id="pdf053"
npm run lint
```

### Preview

```bash id="pdf054"
npm run preview
```

---

## Current Development Status

### Implemented

- Manifest V3 extension
- React popup
- TypeScript
- Vite multi-entry build
- Content script
- Active tab communication
- PDF link scanning
- Multiple PDF detection strategies
- Relative URL resolution
- Duplicate filtering
- Filename extraction
- Filename sanitization
- Single-file download
- Multi-select
- Download selected
- Download all
- Chrome Downloads API
- Extension icons
- React Compiler integration

### Current Limitations

- Only scans `<a href>` elements
- Does not inspect embedded PDF viewers
- Does not scan `<iframe>` documents
- Does not detect PDFs loaded only through XHR/fetch
- Does not inspect network requests
- Does not parse JavaScript-generated download actions without anchors
- Does not display file sizes
- Does not validate MIME type through a network request
- Does not show download progress
- Does not handle download failures in the UI
- No automated tests
- No retry mechanism

---

## Detection Caveat

The extension uses heuristics.

A link whose visible text contains:

```text id="pdf055"
pdf
```

may be detected even when the target is not actually a PDF.

Conversely, a PDF delivered through a URL that exposes no PDF-related metadata may not be detected.

Therefore:

```text id="pdf056"
PDF Detection = DOM Heuristics
```

rather than server-side MIME verification.

---

## Manifest File Note

The repository currently contains:

```text id="pdf057"
/manifest.json
/public/manifest.json
```

The root file is the actual Chrome Manifest V3 configuration.

The file under:

```text id="pdf058"
public/manifest.json
```

is structured like a web-app/PWA manifest rather than a Chrome extension manifest.

Because Vite copies `public/` files into the output directory, this naming collision should be reviewed before production packaging to ensure the intended extension manifest is what ends up in `dist/manifest.json`.

---

## Recommended Improvements

Potential improvements include:

- Consolidate manifest files
- Add content-script rescan button
- Scan `embed` elements
- Scan `object[type="application/pdf"]`
- Inspect iframe sources
- Add filename search
- Add select-all checkbox
- Show detected PDF count
- Show download progress
- Add error feedback
- Add MIME validation
- Add file-size detection
- Add tests
- Add extension packaging workflow
- Add Chrome Web Store release automation

---

## Technical Highlights

The project demonstrates:

- Chrome Extension Manifest V3
- Content script architecture
- Popup/content messaging
- Chrome Tabs API
- Chrome Downloads API
- DOM inspection
- URL normalization
- Duplicate filtering
- File-name sanitization
- React 19
- TypeScript
- Vite multi-entry builds
- Stable content-script bundling

---

## Developer

<div align="center">

### Seyit Buğra Erden

**Full Stack Developer · Software Engineer**

[GitHub](https://github.com/seyitbugraerden) ·
[LinkedIn](https://www.linkedin.com/in/sbugraerden/)

<br />

Built with **React · TypeScript · Vite · Chrome Extension APIs**

</div>
