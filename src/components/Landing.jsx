import './Landing.css';

function Landing({ pages, onOpenPage, onAddPage, onDeletePage, onDuplicatePage, onImport }) {
  return (
    <div className="landing">
      <div className="landing-topbar">
        <span className="landing-topbar-logo">Precedents Database</span>
      </div>
      <div className="landing-content">
        <h1 className="landing-heading">Your Pages</h1>
        <p className="landing-subtitle">
          Select a page to configure, or create a new one.
        </p>
        <div className="landing-grid">
          {pages.map((page) => (
            <div key={page.id} className="landing-card" onClick={() => onOpenPage(page.id)}>
              <div className="landing-card-body">
                <h3 className="landing-card-title">{page.title || 'Untitled'}</h3>
                <span className="landing-card-type">{page.type}</span>
                <span className="landing-card-meta">
                  {page.filters.length} filter{page.filters.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="landing-card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="landing-card-action" onClick={() => onDuplicatePage(page.id)}>
                  Duplicate
                </button>
                <button
                  className="landing-card-action landing-card-action--danger"
                  onClick={() => onDeletePage(page.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          <div className="landing-card landing-card--new" onClick={onAddPage}>
            <span className="landing-card-plus">+</span>
            <span className="landing-card-new-label">New Page</span>
          </div>

          <div className="landing-card landing-card--import" onClick={onImport}>
            <span className="landing-card-import-icon">&uarr;</span>
            <span className="landing-card-new-label">Import PD File</span>
            <span className="landing-card-tooltip">Load a page template shared by someone else</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
