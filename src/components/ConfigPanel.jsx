import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FilterRow from './FilterRow';
import './ConfigPanel.css';

function ConfigPanel({
  config,
  onDeletePage,
  onDuplicatePage,
  onUpdateTitle,
  onUpdateType,
  onAddFilter,
  onAddBulkFilters,
  onUpdateFilter,
  onRemoveFilter,
  onReorderFilters,
  onExport,
  onImport,
  onExportPdf,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setOverIndex(index);
  };

  const handleDrop = (index) => {
    if (dragIndex !== null && dragIndex !== index) {
      onReorderFilters(dragIndex, index);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="config-panel">
      <div className="config-top-row">
        <h2 className="config-heading">Page Configuration</h2>
        <div className="config-top-actions">
          <button className="config-top-link" onClick={onDuplicatePage}>
            Duplicate
          </button>
          <button className="config-top-link config-top-link--danger" onClick={onDeletePage}>
            Delete
          </button>
        </div>
      </div>

      <label className="config-label">
        Page Title
        <input
          type="text"
          className="config-input"
          value={config.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="e.g. Precedents Database"
        />
      </label>

      <label className="config-label">
        Type
        <select
          className="config-select"
          value={config.type}
          onChange={(e) => onUpdateType(e.target.value)}
        >
          <option value="documents">Documents</option>
          <option value="matters">Matters</option>
        </select>
      </label>

      <div className="config-filters-section">
        <div className="config-filters-header">
          <span className="config-label">Filters</span>
          <div className="config-filters-actions">
            <button className="config-add-btn" onClick={onAddFilter}>
              <FontAwesomeIcon icon="fa-solid fa-plus" /> Add filter
            </button>
            <button
              className="config-add-btn config-add-btn--secondary"
              onClick={() => setShowBulkAdd((v) => !v)}
            >
              <FontAwesomeIcon icon="fa-solid fa-paste" /> Bulk add
            </button>
          </div>
        </div>

        {showBulkAdd && (
          <div className="config-bulk-add">
            <textarea
              className="config-bulk-textarea"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Paste filter names here (one per line or comma-separated)"
              rows={4}
            />
            <button
              className="config-bulk-import-btn"
              onClick={() => {
                const names = bulkText
                  .split(/[\n\r,]+/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (names.length > 0) {
                  onAddBulkFilters(names);
                  setBulkText('');
                  setShowBulkAdd(false);
                }
              }}
            >
              <FontAwesomeIcon icon="fa-solid fa-check" /> Add {bulkText.split(/[\n\r,]+/).map(s => s.trim()).filter(Boolean).length} filter{bulkText.split(/[\n\r,]+/).map(s => s.trim()).filter(Boolean).length !== 1 ? 's' : ''}
            </button>
          </div>
        )}

        {config.filters.length === 0 && (
          <p className="config-empty">No filters added yet.</p>
        )}

        {config.filters.map((filter, index) => (
          <div
            key={filter.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            className={
              'filter-row-wrapper' +
              (dragIndex === index ? ' dragging' : '') +
              (overIndex === index && dragIndex !== index ? ' drag-over' : '')
            }
          >
            <FilterRow
              filter={filter}
              onUpdate={(updates) => onUpdateFilter(filter.id, updates)}
              onRemove={() => onRemoveFilter(filter.id)}
            />
          </div>
        ))}
      </div>

      <div className="config-actions">
        <button className="config-action-btn" onClick={onExport}>
          Save PD File
          <span className="tooltip">Share this file with others to let them use your page template</span>
        </button>
        <button className="config-action-btn" onClick={onImport}>
          Import PD File
          <span className="tooltip">Load a page template shared by someone else</span>
        </button>
        <button className="config-action-btn config-action-btn--pdf" onClick={onExportPdf}>
          Export PDF
        </button>
      </div>
    </div>
  );
}

export default ConfigPanel;
