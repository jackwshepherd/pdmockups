import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { generateDummyRows } from '../data/dummyData';
import './PreviewTable.css';

function PreviewTable({ filters, pageType, allowFiles, allFilters, onAddFilter, onUpdateFilter }) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState(null);
  const addBtnRef = useRef(null);
  const pickerRef = useRef(null);
  const rows = generateDummyRows(filters, 5);
  const titleLabel = pageType === 'matters' ? 'Matter Name' : 'Document Title';

  useEffect(() => {
    if (showPicker && addBtnRef.current) {
      const rect = addBtnRef.current.getBoundingClientRect();
      setPickerPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
  }, [showPicker]);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) &&
          addBtnRef.current && !addBtnRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  // Filters that exist but aren't shown as columns yet
  const hiddenFilters = allFilters
    ? allFilters.filter((f) => !f.showInTable && f.name.trim() !== '')
    : [];

  const handleAddExisting = (id) => {
    onUpdateFilter(id, { showInTable: true });
    setShowPicker(false);
  };

  const handleAddNew = () => {
    onAddFilter({ showInTable: true });
    setShowPicker(false);
  };

  return (
    <div className="table-scroll-wrapper">
      <table className="preview-table">
        <thead>
          <tr>
            <th className="col-btn">Link</th>
            <th className="col-btn">Download</th>
            <th className="col-title">{titleLabel}</th>
            {allowFiles && <th className="col-filter">Files</th>}
            {filters.map((f) => (
              <th key={f.id} className="col-filter">{f.name}</th>
            ))}
            <th className="col-add">
              <button
                ref={addBtnRef}
                className="table-add-col-btn"
                onClick={() => setShowPicker((v) => !v)}
                title="Add column"
              >
                <FontAwesomeIcon icon="fa-solid fa-plus" />
              </button>
              {showPicker && pickerPos && createPortal(
                <div
                  ref={pickerRef}
                  className="table-col-picker"
                  style={{ position: 'fixed', top: pickerPos.top, right: pickerPos.right }}
                >
                  {hiddenFilters.length > 0 && (
                    <>
                      <div className="table-col-picker-label">Show existing filter</div>
                      {hiddenFilters.map((f) => (
                        <button
                          key={f.id}
                          className="table-col-picker-item"
                          onClick={() => handleAddExisting(f.id)}
                        >
                          {f.name}
                        </button>
                      ))}
                      <div className="table-col-picker-divider" />
                    </>
                  )}
                  <button className="table-col-picker-item table-col-picker-item--new" onClick={handleAddNew}>
                    <FontAwesomeIcon icon="fa-solid fa-plus" /> New filter
                  </button>
                </div>,
                document.body
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="col-btn">
                <span className="table-btn">Matter Details</span>
              </td>
              <td className="col-btn">
                <span className="table-btn">Download</span>
              </td>
              <td className="col-title">
                <span className="table-title-placeholder" />
              </td>
              {allowFiles && (
                <td className="col-filter table-files-cell">
                  <span className="table-files-icon">&#128206;</span> {Math.floor(Math.random() * 4) + 1}
                </td>
              )}
              {filters.map((f) => (
                <td key={f.id} className="col-filter">{row[f.name]}</td>
              ))}
              <td className="col-add" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PreviewTable;
