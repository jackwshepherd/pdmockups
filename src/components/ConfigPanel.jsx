import { useState } from 'react';
import FilterRow from './FilterRow';
import './ConfigPanel.css';

function ConfigPanel({
  config,
  onGoBack,
  onDeletePage,
  onDuplicatePage,
  onUpdateTitle,
  onUpdateType,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onReorderFilters,
  onExport,
  onImport,
  onExportPdf,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

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
        <button className="config-back-btn" onClick={onGoBack}>
          &larr; All Pages
        </button>
        <div className="config-top-actions">
          <button className="config-top-link" onClick={onDuplicatePage}>
            Duplicate
          </button>
          <button className="config-top-link config-top-link--danger" onClick={onDeletePage}>
            Delete
          </button>
        </div>
      </div>

      <h2 className="config-heading">Page Configuration</h2>

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
          <button className="config-add-btn" onClick={onAddFilter}>
            + Add filter
          </button>
        </div>

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
