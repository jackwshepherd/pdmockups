import { useState, useRef, useEffect, useCallback } from 'react';
import Landing from './components/Landing';
import ConfigPanel from './components/ConfigPanel';
import Preview from './components/Preview';
import './App.css';

const STORAGE_KEY = 'pd-mockups';

let nextFilterId = 1;
let nextPageId = 1;

function createPage() {
  return {
    id: nextPageId++,
    title: '',
    type: 'documents',
    filters: [],
  };
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.pages && data.pages.length > 0) {
        let maxFilterId = 0;
        let maxPageId = 0;
        data.pages.forEach((p) => {
          if (p.id >= maxPageId) maxPageId = p.id;
          p.filters.forEach((f) => {
            if (f.id >= maxFilterId) maxFilterId = f.id;
          });
        });
        nextFilterId = maxFilterId + 1;
        nextPageId = maxPageId + 1;
        return data.pages;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function App() {
  const [pages, setPages] = useState(loadFromStorage);
  const [activePageId, setActivePageId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  const config = activePageId !== null ? pages.find((p) => p.id === activePageId) : null;

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages }));
  }, [pages]);

  const updatePage = useCallback((updater) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePageId ? (typeof updater === 'function' ? updater(p) : { ...p, ...updater }) : p
      )
    );
  }, [activePageId]);

  const updateTitle = (title) => updatePage({ title });
  const updateType = (type) => updatePage({ type });

  const addFilter = () => {
    updatePage((p) => ({
      ...p,
      filters: [
        ...p.filters,
        { id: nextFilterId++, name: '', showInTable: false, values: [] },
      ],
    }));
  };

  const updateFilter = (id, updates) => {
    updatePage((p) => ({
      ...p,
      filters: p.filters.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  };

  const removeFilter = (id) => {
    updatePage((p) => ({
      ...p,
      filters: p.filters.filter((f) => f.id !== id),
    }));
  };

  const reorderFilters = (fromIndex, toIndex) => {
    updatePage((p) => {
      const filters = [...p.filters];
      const [moved] = filters.splice(fromIndex, 1);
      filters.splice(toIndex, 0, moved);
      return { ...p, filters };
    });
  };

  // Page management
  const addPage = () => {
    const page = createPage();
    setPages((prev) => [...prev, page]);
    setActivePageId(page.id);
  };

  const openPage = (id) => {
    setActivePageId(id);
    setDrawerOpen(true);
  };

  const goBack = () => {
    setActivePageId(null);
  };

  const deletePage = (id) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    if (activePageId === id) setActivePageId(null);
  };

  const duplicatePage = (id) => {
    setPages((prev) => {
      const source = prev.find((p) => p.id === id);
      if (!source) return prev;
      const dup = {
        ...structuredClone(source),
        id: nextPageId++,
        title: source.title ? `${source.title} (copy)` : '(copy)',
        filters: source.filters.map((f) => ({ ...f, id: nextFilterId++, values: [...f.values] })),
      };
      setActivePageId(dup.id);
      return [...prev, dup];
    });
  };

  // Import / Export
  const exportConfig = () => {
    if (!config) return;
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.title || 'config'}.pd.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const page = {
          id: nextPageId++,
          title: parsed.title || '',
          type: parsed.type || 'documents',
          filters: (parsed.filters || []).map((f) => ({
            ...f,
            id: nextFilterId++,
            values: f.values || [],
          })),
        };
        setPages((prev) => [...prev, page]);
        setActivePageId(page.id);
      } catch {
        alert('Invalid PD file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportPdf = () => {
    const el = previewRef.current;
    if (!el) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${config.title || 'Preview'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
          <link rel="stylesheet" href="${Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href).join('" /><link rel="stylesheet" href="')}">
          <style>
            ${Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n')}
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>${el.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // Landing page
  if (activePageId === null || !config) {
    return (
      <>
        <Landing
          pages={pages}
          onOpenPage={openPage}
          onAddPage={addPage}
          onDeletePage={deletePage}
          onDuplicatePage={duplicatePage}
          onImport={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={importConfig}
        />
      </>
    );
  }

  // Editor view
  return (
    <div className="app">
      {drawerOpen && (
        <ConfigPanel
          config={config}
          onGoBack={goBack}
          onDeletePage={() => deletePage(activePageId)}
          onDuplicatePage={() => duplicatePage(activePageId)}
          onUpdateTitle={updateTitle}
          onUpdateType={updateType}
          onAddFilter={addFilter}
          onUpdateFilter={updateFilter}
          onRemoveFilter={removeFilter}
          onReorderFilters={reorderFilters}
          onExport={exportConfig}
          onImport={() => fileInputRef.current?.click()}
          onExportPdf={exportPdf}
        />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={importConfig}
      />
      <Preview
        ref={previewRef}
        config={config}
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen((v) => !v)}
      />
    </div>
  );
}

export default App;
