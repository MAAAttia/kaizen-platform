export default function Loading({ label }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
      <span className="w-4 h-4 border-2 border-mist border-t-evergreen rounded-full animate-spin" />
      {label || '…'}
    </div>
  );
}
