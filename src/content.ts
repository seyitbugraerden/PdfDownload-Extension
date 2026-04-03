type PdfItem = {
  url: string;
  name: string;
  type: "pdf";
};

function isPdfUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.endsWith(".pdf") ||
    lowerUrl.includes(".pdf?") ||
    lowerUrl.includes(".pdf#")
  );
}

function getPdfName(url: string): string {
  try {
    const parsedUrl = new URL(url, window.location.href);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    return lastSegment || "unnamed.pdf";
  } catch {
    return "unnamed.pdf";
  }
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function looksLikePdfLink(link: HTMLAnchorElement): boolean {
  const href = normalizeText(link.getAttribute("href"));
  const type = normalizeText(link.getAttribute("type"));
  const download = normalizeText(link.getAttribute("download"));
  const text = normalizeText(link.textContent);
  const title = normalizeText(link.getAttribute("title"));
  const ariaLabel = normalizeText(link.getAttribute("aria-label"));

  return (
    isPdfUrl(link.href) ||
    href.includes(".pdf") ||
    type === "application/pdf" ||
    download.endsWith(".pdf") ||
    text.includes(".pdf") ||
    text.includes("pdf") ||
    title.includes(".pdf") ||
    title.includes("pdf") ||
    ariaLabel.includes(".pdf") ||
    ariaLabel.includes("pdf")
  );
}

function getPdfDisplayName(link: HTMLAnchorElement, url: string): string {
  const downloadName = link.getAttribute("download")?.trim();
  if (downloadName) return downloadName;

  const text = link.textContent?.trim();
  if (text) return text;

  const title = link.getAttribute("title")?.trim();
  if (title) return title;

  return getPdfName(url);
}

function collectPdfItems(): PdfItem[] {
  const links = document.querySelectorAll("a[href]");
  const items: PdfItem[] = [];
  const seen = new Set<string>();

  links.forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;

    const rawUrl = link.href;
    if (!rawUrl) return;

    const absoluteUrl = new URL(rawUrl, window.location.href).href;

    if (!looksLikePdfLink(link)) return;
    if (seen.has(absoluteUrl)) return;

    seen.add(absoluteUrl);

    items.push({
      url: absoluteUrl,
      name: getPdfDisplayName(link, absoluteUrl),
      type: "pdf",
    });
  });

  return items;
}

chrome.runtime.onMessage.addListener((
  message: { type?: string },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: { items: PdfItem[] }) => void
) => {
  if (message.type === "GET_PDF_ITEMS") {
    const items = collectPdfItems();
    sendResponse({ items });
  }

  return true;
});

