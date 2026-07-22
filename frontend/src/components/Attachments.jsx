import { backendURL } from '../api/client.js';

function mediaURL(att) {
  return `${backendURL}${att.url}`;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageAttachment({ att, onDelete }) {
  return (
    <div className="relative group">
      <a href={mediaURL(att)} target="_blank" rel="noopener noreferrer">
        <img
          src={mediaURL(att)}
          alt={att.filename}
          className="rounded-md max-h-64 max-w-full object-cover border border-mist"
        />
      </a>
      {onDelete && (
        <button
          onClick={() => onDelete(att.id)}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove attachment"
        >
          ×
        </button>
      )}
    </div>
  );
}

function VideoAttachment({ att, onDelete }) {
  return (
    <div className="relative group">
      <video
        src={mediaURL(att)}
        controls
        className="rounded-md max-h-64 max-w-full border border-mist bg-black"
      />
      {onDelete && (
        <button
          onClick={() => onDelete(att.id)}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove attachment"
        >
          ×
        </button>
      )}
    </div>
  );
}

function FileAttachment({ att, onDelete }) {
  const isPDF = att.mimetype === 'application/pdf';
  return (
    <div className="flex items-center gap-3 bg-canvas border border-mist rounded-md px-3 py-2.5">
      <span className="text-xl">{isPDF ? '📄' : '📎'}</span>
      <div className="flex-1 min-w-0">
        <a
          href={mediaURL(att)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-evergreen hover:underline truncate block"
        >
          {att.filename}
        </a>
        <span className="text-xs text-slate-400">{formatBytes(att.size)}</span>
      </div>
      {onDelete && (
        <button onClick={() => onDelete(att.id)} className="text-brick text-xs hover:underline shrink-0">
          Remove
        </button>
      )}
    </div>
  );
}

export default function Attachments({ attachments, onDelete }) {
  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter((a) => a.mimetype.startsWith('image/'));
  const videos = attachments.filter((a) => a.mimetype.startsWith('video/'));
  const files = attachments.filter((a) => !a.mimetype.startsWith('image/') && !a.mimetype.startsWith('video/'));

  return (
    <div className="space-y-3 mt-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((att) => (
            <ImageAttachment key={att.id} att={att} onDelete={onDelete} />
          ))}
        </div>
      )}
      {videos.map((att) => (
        <VideoAttachment key={att.id} att={att} onDelete={onDelete} />
      ))}
      {files.map((att) => (
        <FileAttachment key={att.id} att={att} onDelete={onDelete} />
      ))}
    </div>
  );
}
