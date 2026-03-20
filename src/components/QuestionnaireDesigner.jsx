import { useState, useCallback } from 'react';
import './QuestionnaireDesigner.css';

function isDateFilter(name) {
  return /date/i.test(name);
}

let nextSectionId = Date.now();
let nextUploadId = Date.now() + 1000;

function NewFieldForm({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState('dropdown');
  const [showAsFilter, setShowAsFilter] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), fieldType, fieldType === 'dropdown' ? showAsFilter : false);
  };

  return (
    <form className="qd-new-field-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="qd-new-field-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Field name"
        autoFocus
      />
      <div className="qd-new-field-options">
        <select
          className="qd-new-field-type"
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value)}
        >
          <option value="dropdown">Dropdown</option>
          <option value="text">Short text</option>
          <option value="textarea">Long text</option>
        </select>
        {fieldType === 'dropdown' && (
          <label className="qd-new-field-filter-toggle">
            <input type="checkbox" checked={showAsFilter} onChange={(e) => setShowAsFilter(e.target.checked)} />
            Show as filter
          </label>
        )}
      </div>
      <div className="qd-new-field-actions">
        <button type="submit" className="qd-new-field-add" disabled={!name.trim()}>Add</button>
        <button type="button" className="qd-new-field-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// ── Builder panel ───────────────────────────────────────────────

export function QDBuilder({ config, onUpdate, onAddFilter, onUpdateFilter }) {
  const questionnaire = config.questionnaire || { sections: [], uploads: [] };
  const sections = questionnaire.sections || [];
  const uploads = questionnaire.uploads || [];
  const isMatter = config.type === 'matters';

  const [dragSection, setDragSection] = useState(null);
  const [overSection, setOverSection] = useState(null);
  const [dragField, setDragField] = useState(null);
  const [overField, setOverField] = useState(null);
  const [newFieldSection, setNewFieldSection] = useState(null); // sectionId currently adding to

  const persist = useCallback((update) => {
    onUpdate((prev) => ({
      ...prev,
      questionnaire: {
        ...prev.questionnaire,
        sections: prev.questionnaire?.sections || [],
        uploads: prev.questionnaire?.uploads || [],
        ...update,
      },
    }));
  }, [onUpdate]);

  const addSection = () => {
    persist({ sections: [...sections, { id: nextSectionId++, title: '', fields: [] }] });
  };
  const updateSection = (sectionId, updates) => {
    persist({ sections: sections.map((s) => s.id === sectionId ? { ...s, ...updates } : s) });
  };
  const removeSection = (sectionId) => {
    persist({ sections: sections.filter((s) => s.id !== sectionId) });
  };
  const reorderSections = (from, to) => {
    const arr = [...sections];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    persist({ sections: arr });
  };
  const addFieldToSection = (sectionId, filterId) => {
    persist({
      sections: sections.map((s) =>
        s.id === sectionId ? { ...s, fields: [...s.fields, { filterId, description: '' }] } : s
      ),
    });
  };
  const updateFieldInSection = (sectionId, fieldIndex, updates) => {
    persist({
      sections: sections.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.map((f, i) => i === fieldIndex ? { ...f, ...updates } : f) }
          : s
      ),
    });
  };
  const removeFieldFromSection = (sectionId, fieldIndex) => {
    persist({
      sections: sections.map((s) =>
        s.id === sectionId ? { ...s, fields: s.fields.filter((_, i) => i !== fieldIndex) } : s
      ),
    });
  };
  const reorderFieldsInSection = (sectionId, from, to) => {
    persist({
      sections: sections.map((s) => {
        if (s.id !== sectionId) return s;
        const arr = [...s.fields];
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        return { ...s, fields: arr };
      }),
    });
  };
  const addUpload = () => {
    persist({ uploads: [...uploads, { id: nextUploadId++, name: '', required: false }] });
  };
  const updateUpload = (uploadId, updates) => {
    persist({ uploads: uploads.map((u) => u.id === uploadId ? { ...u, ...updates } : u) });
  };
  const removeUpload = (uploadId) => {
    persist({ uploads: uploads.filter((u) => u.id !== uploadId) });
  };

  const assignedFilterIds = new Set();
  sections.forEach((s) => s.fields.forEach((f) => assignedFilterIds.add(f.filterId)));
  const unassignedFilters = config.filters.filter((f) => !assignedFilterIds.has(f.id));
  const getFilterById = (id) => config.filters.find((f) => f.id === id);

  const handleSectionDragStart = (index) => setDragSection(index);
  const handleSectionDragOver = (e, index) => { e.preventDefault(); setOverSection(index); };
  const handleSectionDrop = (index) => {
    if (dragSection !== null && dragSection !== index) reorderSections(dragSection, index);
    setDragSection(null); setOverSection(null);
  };
  const handleSectionDragEnd = () => { setDragSection(null); setOverSection(null); };

  const renderFieldControl = (filter) => {
    const type = filter.fieldType || 'dropdown';
    if (type === 'text') return <input type="text" className="qd-field-control" placeholder="Short text…" disabled />;
    if (type === 'textarea') return <textarea className="qd-field-control qd-field-control--textarea" placeholder="Long text…" disabled />;
    if (isDateFilter(filter.name)) return <input type="date" className="qd-field-control" disabled />;
    return (
      <select className="qd-field-control" disabled>
        <option>Select {filter.name.toLowerCase()}…</option>
      </select>
    );
  };

  const handleCreateField = (sectionId, name, fieldType, showAsFilter) => {
    const newId = onAddFilter({ name, fieldType, showAsFilter });
    // Assign the new field to the section in a separate update using the updater form
    // so it reads the latest state after onAddFilter's update
    onUpdate((prev) => ({
      ...prev,
      questionnaire: {
        ...prev.questionnaire,
        sections: (prev.questionnaire?.sections || []).map((s) =>
          s.id === sectionId ? { ...s, fields: [...s.fields, { filterId: newId, description: '' }] } : s
        ),
      },
    }));
    setNewFieldSection(null);
  };

  return (
    <div className="qd-builder">
      <div className="qd-builder-inner">
        <h1 className="qd-builder-heading">{config.title || 'Record Submission'}</h1>
        <p className="qd-builder-intro">
          Complete the form below to submit a new {isMatter ? 'matter' : 'document'} record.
          Fields marked with <span className="qd-req-star">*</span> are required.
        </p>

        {/* Client / Matter Number — always present */}
        <div className="qd-pinned-section">
          <label className="qd-pinned-label">
            Client / Matter Number <span className="qd-req-star">*</span>
          </label>
          <div className="qd-pinned-hint">Required for every record</div>
          <input type="text" className="qd-pinned-input" placeholder="Enter client or matter number" disabled />
        </div>

        {/* Sections */}
        <div className="qd-sections-header">
          <span className="qd-section-label">Sections</span>
          <button className="qd-add-section-btn" onClick={addSection}>+ Add Section</button>
        </div>

        {sections.length === 0 && (
          <div className="qd-empty-sections" onClick={addSection}>
            <span className="qd-empty-icon">+</span>
            <span>Create your first section to start organizing questions</span>
          </div>
        )}

        {sections.map((section, sIndex) => (
          <div
            key={section.id}
            className={
              'qd-section' +
              (dragSection === sIndex ? ' qd-section--dragging' : '') +
              (overSection === sIndex && dragSection !== sIndex ? ' qd-section--drag-over' : '')
            }
            draggable
            onDragStart={() => handleSectionDragStart(sIndex)}
            onDragOver={(e) => handleSectionDragOver(e, sIndex)}
            onDrop={() => handleSectionDrop(sIndex)}
            onDragEnd={handleSectionDragEnd}
          >
            <div className="qd-section-header">
              <span className="qd-section-drag" title="Drag to reorder">&#x2630;</span>
              <input
                type="text"
                className="qd-section-title-input"
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                placeholder="Section title"
              />
              <button className="qd-section-remove" onClick={() => removeSection(section.id)} title="Remove section">&times;</button>
            </div>

            {section.fields.map((field, fIndex) => {
              const filter = getFilterById(field.filterId);
              if (!filter) return null;
              return (
                <div
                  key={`${field.filterId}-${fIndex}`}
                  className={
                    'qd-field' +
                    (dragField?.sectionId === section.id && dragField?.index === fIndex ? ' qd-field--dragging' : '') +
                    (overField?.sectionId === section.id && overField?.index === fIndex &&
                      !(dragField?.sectionId === section.id && dragField?.index === fIndex) ? ' qd-field--drag-over' : '')
                  }
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); setDragField({ sectionId: section.id, index: fIndex }); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOverField({ sectionId: section.id, index: fIndex }); }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    if (dragField && dragField.sectionId === section.id && dragField.index !== fIndex) {
                      reorderFieldsInSection(section.id, dragField.index, fIndex);
                    }
                    setDragField(null); setOverField(null);
                  }}
                  onDragEnd={() => { setDragField(null); setOverField(null); }}
                >
                  <div className="qd-field-header">
                    <span className="qd-field-drag">&#x2630;</span>
                    <div className="qd-field-header-left">
                      <span className="qd-field-name">{filter.name || 'Unnamed filter'}</span>
                      <input
                        type="text"
                        className="qd-field-desc-input"
                        value={field.description}
                        onChange={(e) => updateFieldInSection(section.id, fIndex, { description: e.target.value })}
                        placeholder="Add help text…"
                      />
                    </div>
                    {renderFieldControl(filter)}
                    <button className="qd-field-remove" onClick={() => removeFieldFromSection(section.id, fIndex)}>&times;</button>
                  </div>
                </div>
              );
            })}

            <div className="qd-add-field-row">
              {unassignedFilters.length > 0 && (
                <select
                  className="qd-add-field-select"
                  value=""
                  onChange={(e) => { if (e.target.value) addFieldToSection(section.id, Number(e.target.value)); }}
                >
                  <option value="">+ Add existing filter…</option>
                  {unassignedFilters.map((f) => (
                    <option key={f.id} value={f.id}>{f.name || `Filter #${f.id}`}</option>
                  ))}
                </select>
              )}
              {newFieldSection === section.id ? (
                <NewFieldForm
                  onAdd={(name, fieldType, showAsFilter) => handleCreateField(section.id, name, fieldType, showAsFilter)}
                  onCancel={() => setNewFieldSection(null)}
                />
              ) : (
                <button className="qd-new-field-btn" onClick={() => setNewFieldSection(section.id)}>
                  + New field
                </button>
              )}
            </div>
          </div>
        ))}

        {unassignedFilters.length > 0 && sections.length > 0 && (
          <div className="qd-unassigned-notice">
            <strong>{unassignedFilters.length}</strong> filter{unassignedFilters.length !== 1 ? 's' : ''} not yet
            assigned to a section:{' '}
            {unassignedFilters.map((f) => f.name || `#${f.id}`).join(', ')}
          </div>
        )}

        {/* Document Uploads */}
        <div className="qd-uploads-section">
          <div className="qd-uploads-header">
            <span className="qd-section-label">{isMatter ? 'Document Uploads' : 'Document Upload'}</span>
          </div>

          {isMatter ? (
            <>
              <p className="qd-uploads-hint">
                Define the documents users need to upload for this matter record.
              </p>
              {uploads.map((upload) => (
                <div key={upload.id} className="qd-upload-row">
                  <input
                    type="text"
                    className="qd-upload-name-input"
                    value={upload.name}
                    onChange={(e) => updateUpload(upload.id, { name: e.target.value })}
                    placeholder="Document name, e.g. Executed Agreement"
                  />
                  <label className="qd-upload-required-label">
                    <input type="checkbox" checked={upload.required} onChange={(e) => updateUpload(upload.id, { required: e.target.checked })} />
                    Required
                  </label>
                  <button className="qd-upload-remove" onClick={() => removeUpload(upload.id)}>&times;</button>
                </div>
              ))}
              <button className="qd-add-upload-btn" onClick={addUpload}>+ Add Document Slot</button>
            </>
          ) : (
            <div className="qd-single-upload-info">
              <div className="qd-single-upload-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <span className="qd-single-upload-title">Drag & drop or click to upload</span>
            </div>
          )}
        </div>

        <div className="qd-preview-submit-row">
          <button className="qd-preview-submit-btn" disabled>Submit Record</button>
        </div>
      </div>
    </div>
  );
}

// ── Preview panel (goes in the main area) ───────────────────────

export function QDPreview({ config }) {
  const questionnaire = config.questionnaire || { sections: [], uploads: [] };
  const sections = questionnaire.sections || [];
  const uploads = questionnaire.uploads || [];
  const isMatter = config.type === 'matters';
  const getFilterById = (id) => config.filters.find((f) => f.id === id);

  return (
    <div className="qd-preview-body">
      <div className="qd-preview-form">
        <h1 className="qd-preview-heading">{config.title || 'Record Submission'}</h1>
        <p className="qd-preview-intro">
          Complete the form below to submit a new {isMatter ? 'matter' : 'document'} record.
          Fields marked with <span className="qd-req-star">*</span> are required.
        </p>

        {/* Client / Matter Number */}
        <div className="qd-preview-section">
          <div className="qd-preview-field">
            <label className="qd-preview-label">
              Client / Matter Number <span className="qd-req-star">*</span>
            </label>
            <input type="text" className="qd-preview-input" placeholder="Enter client or matter number" disabled />
          </div>
        </div>

        {/* Sections */}
        {sections.map((section) => {
          const sectionFields = section.fields
            .map((f) => ({ ...f, filter: getFilterById(f.filterId) }))
            .filter((f) => f.filter);
          if (sectionFields.length === 0 && !section.title) return null;
          return (
            <div key={section.id} className="qd-preview-section">
              {section.title && <h2 className="qd-preview-section-title">{section.title}</h2>}
              {sectionFields.map((field, i) => (
                <div key={i} className="qd-preview-field">
                  <label className="qd-preview-label">{field.filter.name}</label>
                  {field.description && <p className="qd-preview-field-desc">{field.description}</p>}
                  {isDateFilter(field.filter.name) ? (
                    <input type="date" className="qd-preview-input" disabled />
                  ) : (
                    <select className="qd-preview-select" disabled>
                      <option>Select {field.filter.name.toLowerCase()}...</option>
                    </select>
                  )}
                </div>
              ))}
              {sectionFields.length === 0 && (
                <p className="qd-preview-empty-section">No questions in this section yet</p>
              )}
            </div>
          );
        })}

        {/* Document upload preview */}
        {isMatter ? (
          uploads.length > 0 && (
            <div className="qd-preview-section">
              <h2 className="qd-preview-section-title">Documents</h2>
              {uploads.map((upload) => (
                <div key={upload.id} className="qd-preview-upload-slot">
                  <label className="qd-preview-label">
                    {upload.name || 'Untitled Document'}
                    {upload.required && <span className="qd-req-star"> *</span>}
                  </label>
                  <div className="qd-preview-upload-zone">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span>Drag & drop or click to upload</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="qd-preview-section">
            <h2 className="qd-preview-section-title">Upload Document</h2>
            <div className="qd-preview-upload-slot">
              <label className="qd-preview-label">
                Document File <span className="qd-req-star">*</span>
              </label>
              <div className="qd-preview-upload-zone">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span>Drag & drop or click to upload</span>
              </div>
            </div>
          </div>
        )}

        <div className="qd-preview-submit-row">
          <button className="qd-preview-submit-btn" disabled>Submit Record</button>
        </div>
      </div>
    </div>
  );
}
