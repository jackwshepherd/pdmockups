import { forwardRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PreviewTable from './PreviewTable';
import ValuesModal from './ValuesModal';
import { getFilterValues } from '../data/dummyData';
import './Preview.css';

function isDateFilter(name) {
  return /date/i.test(name);
}

const Preview = forwardRef(function Preview({
  config,
  onUpdateTitle,
  onUpdateType,
  onAddFilter,
  onAddBulkFilters,
  onUpdateFilter,
  onRemoveFilter,
  onReorderFilters,
}, ref) {
  const [editingFilterId, setEditingFilterId] = useState(null);
  const [valuesModalFilterId, setValuesModalFilterId] = useState(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const filterableFields = config.filters.filter((f) => f.showAsFilter !== false && (f.fieldType || 'dropdown') === 'dropdown');
  const namedFilters = filterableFields.filter((f) => f.name.trim() !== '');
  const tableFilters = namedFilters.filter((f) => f.showInTable);
  const valuesModalFilter = valuesModalFilterId
    ? config.filters.find((f) => f.id === valuesModalFilterId)
    : null;

  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setOverIndex(index);
  };

  // Map filterableFields indices back to config.filters indices for reorder
  const toFullIndex = (subIndex) => {
    const id = filterableFields[subIndex]?.id;
    return config.filters.findIndex((f) => f.id === id);
  };

  const handleDrop = (index) => {
    if (dragIndex !== null && dragIndex !== index) {
      onReorderFilters(toFullIndex(dragIndex), toFullIndex(index));
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="preview" ref={ref}>
      <div className="preview-content">
        <input
          type="text"
          className="preview-title-input"
          value={config.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="Click to add page title…"
        />

        <div className="preview-type-row">
          <span className="preview-type-label">Type:</span>
          <button
            className={'preview-type-btn' + (config.type === 'documents' ? ' preview-type-btn--active' : '')}
            onClick={() => onUpdateType('documents')}
          >
            Documents
          </button>
          <button
            className={'preview-type-btn' + (config.type === 'matters' ? ' preview-type-btn--active' : '')}
            onClick={() => onUpdateType('matters')}
          >
            Matters
          </button>
        </div>

        <p className="preview-instructions">
          Use the filters to find the {config.type === 'matters' ? 'matter' : 'document'} you want.
          Select from the dropdowns below and click search.
        </p>

        <div className="preview-filters-grid">
          {filterableFields.map((filter, index) => (
            <div
              key={filter.id}
              className={
                'preview-filter' +
                (dragIndex === index ? ' preview-filter--dragging' : '') +
                (overIndex === index && dragIndex !== index ? ' preview-filter--drag-over' : '')
              }
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
            >
              <div className="preview-filter-top">
                {editingFilterId === filter.id ? (
                  <input
                    type="text"
                    className="preview-filter-name-input"
                    value={filter.name}
                    onChange={(e) => onUpdateFilter(filter.id, { name: e.target.value })}
                    onBlur={() => setEditingFilterId(null)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setEditingFilterId(null); }}
                    autoFocus
                    placeholder="Filter name"
                  />
                ) : (
                  <label
                    className="preview-filter-label has-tooltip"
                    onClick={() => setEditingFilterId(filter.id)}
                    data-tooltip="Click to rename"
                  >
                    {filter.name || 'Untitled filter'}
                  </label>
                )}
                <div className="preview-filter-actions">
                  <button
                    className={'preview-filter-action-btn has-tooltip' + (filter.showInTable ? ' preview-filter-action-btn--active' : '')}
                    onClick={() => onUpdateFilter(filter.id, { showInTable: !filter.showInTable })}
                    data-tooltip={filter.showInTable ? 'Showing as column' : 'Show as column'}
                  >
                    <FontAwesomeIcon icon="fa-solid fa-table-columns" />
                  </button>
                  <button
                    className="preview-filter-action-btn has-tooltip"
                    onClick={() => setValuesModalFilterId(filter.id)}
                    data-tooltip="Edit values"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-list" />
                  </button>
                  <button
                    className="preview-filter-action-btn preview-filter-action-btn--danger has-tooltip"
                    onClick={() => onRemoveFilter(filter.id)}
                    data-tooltip="Remove"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-xmark" />
                  </button>
                  <span className="preview-filter-drag-handle has-tooltip" data-tooltip="Drag to reorder">
                    <FontAwesomeIcon icon="fa-solid fa-grip-vertical" />
                  </span>
                </div>
              </div>
              {filter.name.trim() !== '' && (
                isDateFilter(filter.name) ? (
                  <input type="date" className="preview-filter-date" />
                ) : (
                  <select className="preview-filter-select">
                    <option value="">All</option>
                    {getFilterValues(filter).map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                )
              )}
              <span className="preview-filter-value-count">
                {filter.values.length} value{filter.values.length !== 1 ? 's' : ''}
              </span>
            </div>
          ))}

          {/* Add filter card */}
          <div className="preview-filter preview-filter--add" onClick={() => onAddFilter()}>
            <FontAwesomeIcon icon="fa-solid fa-plus" />
            <span>Add filter</span>
          </div>

          {/* Bulk add card */}
          <div
            className="preview-filter preview-filter--add"
            onClick={() => setShowBulkAdd((v) => !v)}
          >
            <FontAwesomeIcon icon="fa-solid fa-paste" />
            <span>Bulk add</span>
          </div>
        </div>

        {showBulkAdd && (
          <div className="preview-bulk-add">
            <textarea
              className="preview-bulk-textarea"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Paste filter names here (one per line or comma-separated)"
              rows={4}
              autoFocus
            />
            <div className="preview-bulk-actions">
              <button
                className="preview-bulk-import-btn"
                onClick={() => {
                  const names = bulkText.split(/[\n\r,]+/).map((s) => s.trim()).filter(Boolean);
                  if (names.length > 0) {
                    onAddBulkFilters(names);
                    setBulkText('');
                    setShowBulkAdd(false);
                  }
                }}
              >
                <FontAwesomeIcon icon="fa-solid fa-check" /> Add {bulkText.split(/[\n\r,]+/).map(s => s.trim()).filter(Boolean).length} filter{bulkText.split(/[\n\r,]+/).map(s => s.trim()).filter(Boolean).length !== 1 ? 's' : ''}
              </button>
              <button className="preview-bulk-cancel-btn" onClick={() => { setShowBulkAdd(false); setBulkText(''); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <button className="preview-search-btn">Search</button>

        <PreviewTable filters={tableFilters} pageType={config.type} />
      </div>

      {valuesModalFilter && (
        <ValuesModal
          filterName={valuesModalFilter.name}
          values={valuesModalFilter.values}
          onSave={(newValues) => onUpdateFilter(valuesModalFilter.id, { values: newValues })}
          onClose={() => setValuesModalFilterId(null)}
        />
      )}
    </div>
  );
});

export default Preview;
