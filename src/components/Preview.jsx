import { forwardRef } from 'react';
import PreviewTable from './PreviewTable';
import { getFilterValues } from '../data/dummyData';
import './Preview.css';

const Preview = forwardRef(function Preview({ config, drawerOpen, onToggleDrawer }, ref) {
  const namedFilters = config.filters.filter((f) => f.name.trim() !== '');
  const tableFilters = namedFilters.filter((f) => f.showInTable);

  return (
    <div className="preview" ref={ref}>
      <div className="preview-topbar">
        <button className="drawer-toggle" onClick={onToggleDrawer}>
          {drawerOpen ? '\u2190' : '\u2192'} {drawerOpen ? 'Hide' : 'Configure'}
        </button>
        <span className="preview-topbar-logo">Precedents Database</span>
      </div>

      <div className="preview-content">
        <h1 className="preview-title">
          {config.title || 'Page Title'}
        </h1>

        <p className="preview-instructions">
          Use the filters to find the {config.type === 'matters' ? 'matter' : 'document'} you want. Select from the dropdowns below and click search.
        </p>

        {namedFilters.length > 0 ? (
          <div className="preview-filters-grid">
            {namedFilters.map((filter) => (
              <div key={filter.id} className="preview-filter">
                <label className="preview-filter-label">{filter.name}</label>
                <select className="preview-filter-select">
                  <option value="">All</option>
                  {getFilterValues(filter).map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="preview-add-filter-placeholder"
            onClick={() => { if (!drawerOpen) onToggleDrawer(); }}
          >
            + Add filters in the configuration panel to see them here
          </div>
        )}

        <button className="preview-search-btn">Search</button>

        <PreviewTable filters={tableFilters} pageType={config.type} />
      </div>
    </div>
  );
});

export default Preview;
