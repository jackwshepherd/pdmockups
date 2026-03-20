import { useState, useRef } from 'react';
import './Modal.css';
import './ValuesModal.css';

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

function ValuesModal({ filterName, values, onSave, onClose }) {
  const [localValues, setLocalValues] = useState(() => dedupeSorted(values));
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
      const text = evt.target.result;
      const parsed = parseValues(text);
      if (parsed.length > 0) {
        setLocalValues((prev) => dedupeSorted([...prev, ...parsed]));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = () => {
    onSave(localValues);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            Values for "{filterName || 'Untitled filter'}"
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
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
            <button
              className="modal-import-btn"
              onClick={() => setShowPasteBox((v) => !v)}
            >
              Paste list
            </button>
            <button
              className="modal-import-btn"
              onClick={() => fileInputRef.current?.click()}
            >
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
                <button
                  className="modal-value-remove"
                  onClick={() => removeValue(val)}
                >
                  &times;
                </button>
              </div>
            ))}
            {localValues.length === 0 && (
              <p className="modal-empty">No values yet. Add values above or import from a file.</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="modal-save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default ValuesModal;
