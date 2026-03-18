import { useState } from 'react';
import ValuesModal from './ValuesModal';
import './FilterRow.css';

function FilterRow({ filter, onUpdate, onRemove }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="filter-row">
        <div className="filter-row-header">
          <span className="filter-drag-handle" title="Drag to reorder">&#x2630;</span>
          <input
            type="text"
            className="filter-name-input"
            value={filter.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Filter name"
          />
          <label className="filter-checkbox-label">
            <input
              type="checkbox"
              checked={filter.showInTable}
              onChange={(e) => onUpdate({ showInTable: e.target.checked })}
            />
            Show as column
          </label>
          <button className="filter-remove-btn" onClick={onRemove}>
            &times;
          </button>
        </div>
        <div className="filter-row-footer">
          <button className="filter-edit-values-btn" onClick={() => setModalOpen(true)}>
            Edit values ({filter.values.length})
          </button>
        </div>
      </div>

      {modalOpen && (
        <ValuesModal
          filterName={filter.name}
          values={filter.values}
          onSave={(newValues) => onUpdate({ values: newValues })}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

export default FilterRow;
