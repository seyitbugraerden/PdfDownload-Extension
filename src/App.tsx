import { useEffect, useState } from "react";

type PdfItem = {
  url: string;
  name: string;
  type: "pdf";
};


function App() {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<PdfItem[]>([]);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      const activeTabId = tabs[0]?.id;

      if (!activeTabId) return;

      chrome.tabs.sendMessage(
        activeTabId,
        { type: "GET_PDF_ITEMS" },
        (response: { items?: PdfItem[] } | undefined) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
          }

          const nextItems = response?.items || [];
          setItems(nextItems);
          setSelectedItems((currentSelected) =>
            currentSelected.filter((selectedItem) =>
              nextItems.some((item) => item.url === selectedItem.url)
            )
          );
        }
      );
    });
  }, []);

  function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*]+/g, "_");
  }

  const handleDownload = (item: PdfItem) => {
    const safeName = sanitizeFileName(item.name);

    chrome.downloads.download({
      url: item.url,
      filename: safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`,
      saveAs: false,
    });
  };

  const isItemSelected = (item: PdfItem) =>
    selectedItems.some((selectedItem) => selectedItem.url === item.url);

  const handleToggleItem = (item: PdfItem, checked: boolean) => {
    setSelectedItems((currentSelected) => {
      if (checked) {
        if (currentSelected.some((selectedItem) => selectedItem.url === item.url)) {
          return currentSelected;
        }

        return [...currentSelected, item];
      }

      return currentSelected.filter((selectedItem) => selectedItem.url !== item.url);
    });
  };

  const handleDownloadSelected = () => {
    selectedItems.forEach(handleDownload);
  };

  const handleDownloadAll = () => {
    items.forEach(handleDownload);
  };

  return (
    <div style={{ minWidth: 340, maxWidth: 420, padding: 16 }}>
      <h1>PDF Files</h1>
      {items.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={handleDownloadSelected}
            disabled={selectedItems.length === 0}
          >
            Download Selected Files
          </button>
          <button type="button" onClick={handleDownloadAll}>
            Download All Files
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p>No PDF files found on this page.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((item, index) => (
            <li
              key={`${item.url}-${index}`}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={isItemSelected(item)}
                  onChange={(event) => handleToggleItem(item, event.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ display: "flex", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      Type: {item.type}
                    </div>
                    <img src="/download.png" onClick={() => handleDownload(item)} alt="Download Icon" width={24} height={24} style={{ cursor: "pointer" }} />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#666",
                      wordBreak: "break-all",
                      marginTop: 6,
                    }}
                  >
                    {item.url}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

}

export default App
