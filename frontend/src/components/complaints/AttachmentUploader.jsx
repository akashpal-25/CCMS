import React, { useRef } from 'react';
import { UploadCloud, File, X, Image as ImageIcon } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

const AttachmentUploader = ({ files = [], onFilesChange, maxFiles = 4 }) => {
  const inputRef = useRef();

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    const valid = selected.filter((file) => {
      const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      return allowed.includes(file.type);
    });

    const mapped = valid.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      file: file
    }));
    
    onFilesChange([...files, ...mapped].slice(0, maxFiles));
  };

  const handleRemove = (index) => {
    const next = files.filter((_, i) => i !== index);
    onFilesChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
        Supporting Attachments (PDF, JPG, PNG - Max {maxFiles} files)
      </label>

      <div
        onClick={() => inputRef.current.click()}
        style={{
          border: '2px dashed var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg-muted)',
          cursor: 'pointer',
          transition: 'var(--transition-fast)'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <UploadCloud size={28} style={{ color: 'var(--color-accent)', margin: '0 auto 0.5rem' }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', fontWeight: 500 }}>
          Click to browse or drop supporting documents
        </p>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Screenshots, receipts, or official requests (Mock local upload)
        </span>
      </div>

      {files.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
          {files.map((file, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                {file.type?.includes('image') ? (
                  <ImageIcon size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                ) : (
                  <File size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                )}
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <p style={{ fontWeight: 500, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden' }}>{file.name}</p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{formatFileSize(file.size)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-not-solved-text)' }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;