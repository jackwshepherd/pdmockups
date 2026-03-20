import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { generateDummyRows } from '../data/dummyData';
import './PreviewTable.css';

function PreviewTable({ filters, pageType, allFilters, onAddFilter, onUpdateFilter }) {
  const [showPicker, setShowPicker] = useState(false);
  const rows = generateDummyRows(filters, 5);
  const titleLabel = pageType === 'matters' ? 'Matter Name' : 'Document Title';

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
            {filters.map((f) => (
              <th key={f.id} className="col-filter">{f.name}</th>
            ))}
            <th className="col-add">
              <button
                className="table-add-col-btn"
                onClick={() => setShowPicker((v) => !v)}
                title="Add column"
              >
                <FontAwesomeIcon icon="fa-solid fa-plus" />
              </button>
              {showPicker && (
                <div className="table-col-picker">
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
                </div>
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
