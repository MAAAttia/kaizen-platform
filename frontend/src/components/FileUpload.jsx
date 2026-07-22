import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const MAX_FILES = 5;
const MAX_MB = 20;
const ALLOWED = '.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.pdf';

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimetype }) {
  if (mimetype.startsWith('video/')) return <span className="text-2xl">🎬</span>;
  if (mimetype === 'application/pdf') return <span className="text-2xl">📄</span>;
  return <span className="text-2xl">🖼</span>;
}

function FilePreview({ file, onRemove }) {
  const isImage = file.type.startsWith('image/');
  const previewURL = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="relative group w-20 shrink-0">
      <div className="w-20 h-20 rounded-md border border-mist bg-canvas overflow-hidden flex items-center justify-center">
        {previewURL ? (
          <img src={previewURL} alt={file.name} className="w-full h-full object-cover"
            onLoad={() => URL.revokeObjectURL(previewURL)} />
        ) : (
          <FileIcon mimetype={file.type} />
        )}
      </div>
      <button type="button" onClick={() => onRemove(file)}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brick text-canvas text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove">
        ×
      </button>
      <p className="text-xs text-slate-500 mt-1 truncate w-full" title={file.name}>{file.name}</p>
      <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
    </div>
  );
}

export default function FileUpload({ files, onChange }) {
  const inputRef = useRef(null);
  const { t } = useTranslation();

  const handleSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const combined = [...files];
    for (const f of selected) {
      if (combined.length >= MAX_FILES) break;
      if (f.size > MAX_MB * 1024 * 1024) {
        alert(t('upload.tooLarge', { name: f.name, max: MAX_MB }));
        continue;
      }
      if (!combined.find((x) => x.name === f.name && x.size === f.size)) combined.push(f);
    }
    onChange(combined);
    e.target.value = '';
  };

  const remove = (file) => onChange(files.filter((f) => f !== file));
  const remaining = MAX_FILES - files.length;

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-2">
        {files.map((f, i) => (
          <FilePreview key={`${f.name}-${i}`} file={f} onRemove={remove} />
        ))}
        {remaining > 0 && (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-md border-2 border-dashed border-mist hover:border-evergreen/50 flex flex-col items-center justify-center text-slate-400 hover:text-evergreen transition-colors text-xs gap-1">
            <span className="text-2xl leading-none">+</span>
            <span>{t('upload.addFile')}</span>
          </button>
        )}
      </div>

      {files.length > 0 && (
        <p className="text-xs text-slate-400">
          {t('upload.selected', { count: files.length, max: MAX_FILES })}
          {remaining > 0 && <> · {t('upload.remaining', { count: remaining })}</>}
        </p>
      )}

      <input ref={inputRef} type="file" multiple accept={ALLOWED} onChange={handleSelect} className="hidden" />
      <p className="text-xs text-slate-400 mt-1">
        {t('upload.hint', { max: MAX_MB, files: MAX_FILES })}
      </p>
    </div>
  );
}
