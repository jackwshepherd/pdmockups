import { generateDummyRows } from '../data/dummyData';
import './PreviewTable.css';

function PreviewTable({ filters, pageType }) {
  const rows = generateDummyRows(filters, 5);
  const titleLabel = pageType === 'matters' ? 'Matter Name' : 'Document Title';

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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PreviewTable;
