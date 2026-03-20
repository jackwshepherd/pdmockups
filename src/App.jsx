import { useState, useRef, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Landing from './components/Landing';
import Preview from './components/Preview';
import { QDBuilder } from './components/QuestionnaireDesigner';
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
    questionnaire: { sections: [], uploads: [] },
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

// Parse share link once at module level so we don't double-consume it
const _sharedPage = (() => {
  const hash = window.location.hash;
  if (!hash.startsWith('#share=')) return null;
  try {
    const compressed = hash.slice('#share='.length);
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    const parsed = JSON.parse(json);
    const page = {
      id: nextPageId++,
      title: parsed.title || '',
      type: parsed.type || 'documents',
      filters: (parsed.filters || []).map((f) => ({
        ...f,
        id: nextFilterId++,
        values: f.values || [],
      })),
      questionnaire: parsed.questionnaire || { sections: [], uploads: [] },
    };
    window.history.replaceState(null, '', window.location.pathname);
    return page;
  } catch {
    return null;
  }
})();

function App() {
  const [pages, setPages] = useState(() => {
    const stored = loadFromStorage();
    return _sharedPage ? [...stored, _sharedPage] : stored;
  });
  const [activePageId, setActivePageId] = useState(_sharedPage?.id ?? null);
  const [view, setView] = useState('editor'); // 'editor' | 'questionnaire'
  const [shareToast, setShareToast] = useState(false);
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

  const addFilter = (overrides) => {
    const id = nextFilterId++;
    updatePage((p) => ({
      ...p,
      filters: [
        ...p.filters,
        { id, name: '', fieldType: 'dropdown', showAsFilter: true, showInTable: false, values: [], ...overrides },
      ],
    }));
    return id;
  };

  const addBulkFilters = (names) => {
    updatePage((p) => ({
      ...p,
      filters: [
        ...p.filters,
        ...names.map((name) => ({ id: nextFilterId++, name, fieldType: 'dropdown', showAsFilter: true, showInTable: false, values: [] })),
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
    setView('editor');
  };

  const goBack = () => {
    setActivePageId(null);
    setView('editor');
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
          questionnaire: parsed.questionnaire || { sections: [], uploads: [] },
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

  const shareLink = () => {
    if (!config) return;
    const { id, ...data } = config;
    // Strip filter IDs to save space
    data.filters = data.filters.map(({ id, ...rest }) => rest);
    const json = JSON.stringify(data);
    const compressed = compressToEncodedURIComponent(json);
    const url = `${window.location.origin}${window.location.pathname}#share=${compressed}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    });
  };

  const exportPdf = async () => {
    const el = previewRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#fff',
    });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const pdfWidth = imgWidth * 0.75;
    const pdfHeight = imgHeight * 0.75;
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [pdfWidth, pdfHeight],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${config.title || 'preview'}.pdf`);
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

  return (
    <div className="app-layout">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={importConfig}
      />

      <div className="app-main">
        <div className="app-main-topbar">
          <button className="app-topbar-back" onClick={goBack}>
            <FontAwesomeIcon icon="fa-solid fa-arrow-left" />
          </button>
          <span className="app-main-logo">Precedents Database</span>

          <div className="app-tabs">
            <button
              className={'app-tab' + (view === 'editor' ? ' app-tab--active' : '')}
              onClick={() => setView('editor')}
            >
              Page Builder
            </button>
            <button
              className={'app-tab' + (view === 'questionnaire' ? ' app-tab--active' : '')}
              onClick={() => setView('questionnaire')}
            >
              Questionnaire
            </button>
          </div>

          <div className="app-topbar-actions">
            <button className="app-topbar-btn" onClick={shareLink} title="Copy share link">
              <FontAwesomeIcon icon="fa-solid fa-share-nodes" />
            </button>
            <button className="app-topbar-btn" onClick={() => duplicatePage(activePageId)} title="Duplicate page">
              <FontAwesomeIcon icon="fa-solid fa-copy" />
            </button>
            <button className="app-topbar-btn" onClick={exportConfig} title="Save PD file">
              <FontAwesomeIcon icon="fa-solid fa-floppy-disk" />
            </button>
            <button className="app-topbar-btn" onClick={() => fileInputRef.current?.click()} title="Import PD file">
              <FontAwesomeIcon icon="fa-solid fa-file-import" />
            </button>
            <button className="app-topbar-btn" onClick={exportPdf} title="Export PDF">
              <FontAwesomeIcon icon="fa-solid fa-file-pdf" />
            </button>
            <button
              className="app-topbar-btn app-topbar-btn--danger"
              onClick={() => deletePage(activePageId)}
              title="Delete page"
            >
              <FontAwesomeIcon icon="fa-solid fa-trash" />
            </button>
          </div>
        </div>

        <div className="app-main-content">
          {view === 'editor' ? (
            <Preview
              ref={previewRef}
              config={config}
              onUpdateTitle={updateTitle}
              onUpdateType={updateType}
              onAddFilter={addFilter}
              onAddBulkFilters={addBulkFilters}
              onUpdateFilter={updateFilter}
              onRemoveFilter={removeFilter}
              onReorderFilters={reorderFilters}
            />
          ) : (
            <QDBuilder config={config} onUpdate={updatePage} onAddFilter={addFilter} onUpdateFilter={updateFilter} />
          )}
        </div>
      </div>

      {shareToast && <div className="app-toast">Link copied to clipboard</div>}
    </div>
  );
}

export default App;
