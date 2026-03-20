import { useState, useRef } from 'react';
import './FilterEditModal.css';

function parseValues(text) {
  return text
    .split(/[\n\r\t,]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function dedupeSorted(arr) {
  const unique = [...new Set(arr)];
  unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  return unique;
}

function FilterEditModal({ filter, onUpdate, onRemove, onClose }) {
  const [name, setName] = useState(filter.name);
  const [fieldType, setFieldType] = useState(filter.fieldType || 'dropdown');
  const [showInTable, setShowInTable] = useState(filter.showInTable);
  const [localValues, setLocalValues] = useState(() => dedupeSorted(filter.values || []));
  const [newValue, setNewValue] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const fileInputRef = useRef(null);

  const addSingle = () => {
    const trimmed = newValue.trim();
    if (trimmed) {
      setLocalValues((prev) => dedupeSorted([...prev, trimmed]));
      setNewValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSingle();
    }
  };

  const removeValue = (val) => {
    setLocalValues((prev) => prev.filter((v) => v !== val));
  };

  const handlePasteImport = () => {
    const parsed = parseValues(pasteText);
    if (parsed.length > 0) {
      setLocalValues((prev) => dedupeSorted([...prev, ...parsed]));
      setPasteText('');
      setShowPasteBox(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const parsed = parseValues(evt.target.result);
      if (parsed.length > 0) {
        setLocalValues((prev) => dedupeSorted([...prev, ...parsed]));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = () => {
    onUpdate(filter.id, {
      name,
      fieldType,
      showInTable,
      values: fieldType === 'boolean' ? [] : localValues,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal filter-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Filter</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="fem-field">
            <label className="fem-label">Name</label>
            <input
              type="text"
              className="fem-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Filter name"
              autoFocus
            />
          </div>

          <div className="fem-field">
            <label className="fem-label">Type</label>
            <select
              className="fem-select"
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
            >
              <option value="dropdown">Dropdown</option>
              <option value="boolean">Boolean (Yes / No)</option>
            </select>
          </div>

          <div className="fem-field fem-field--inline">
            <label className="fem-checkbox-label">
              <input
                type="checkbox"
                checked={showInTable}
                onChange={(e) => setShowInTable(e.target.checked)}
              />
              Show as column in results table
            </label>
          </div>

          {fieldType === 'dropdown' && (
            <div className="fem-values-section">
              <label className="fem-label">Values</label>

              <div className="modal-add-row">
                <input
                  type="text"
                  className="modal-add-input"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a value and press Enter"
                />
                <button className="modal-add-btn" onClick={addSingle}>Add</button>
              </div>

              <div className="modal-import-row">
                <button className="modal-import-btn" onClick={() => setShowPasteBox((v) => !v)}>
                  Paste list
                </button>
                <button className="modal-import-btn" onClick={() => fileInputRef.current?.click()}>
                  Upload file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xls,.xlsx"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>

              {showPasteBox && (
                <div className="modal-paste-section">
                  <textarea
                    className="modal-paste-box"
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste values here (one per line, or comma/tab separated)"
                    rows={5}
                  />
                  <button className="modal-paste-import-btn" onClick={handlePasteImport}>
                    Import pasted values
                  </button>
                </div>
              )}

              <div className="modal-values-count">
                {localValues.length} value{localValues.length !== 1 ? 's' : ''} (sorted A-Z)
              </div>

              <div className="modal-values-list">
                {localValues.map((val) => (
                  <div key={val} className="modal-value-item">
                    <span>{val}</span>
                    <button className="modal-value-remove" onClick={() => removeValue(val)}>
                      &times;
                    </button>
                  </div>
                ))}
                {localValues.length === 0 && (
                  <p className="modal-empty">No values yet. Add values above or import from a file.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="fem-delete-btn"
            onClick={() => { onRemove(filter.id); onClose(); }}
          >
            Delete filter
          </button>
          <div className="fem-footer-right">
            <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="modal-save-btn" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterEditModal;
