const STATUS_LABEL = {
  pending: '대기중',
  converting: '변환중',
  done: '완료',
  error: '실패',
}

const STATUS_COLOR = {
  pending: 'text-gray-400',
  converting: 'text-indigo-500',
  done: 'text-emerald-500',
  error: 'text-red-500',
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export default function FileQueue({ files, onRemove }) {
  if (files.length === 0) return null

  return (
    <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden">
      {files.map((item) => (
        <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-b-0">
          <div className="flex items-center gap-3 min-w-0">
            <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-700 truncate">{item.file.name}</span>
            <span className="text-xs text-gray-300 shrink-0">{formatSize(item.file.size)}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {item.status === 'converting' && (
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            )}
            <span className={`text-xs font-medium ${STATUS_COLOR[item.status]}`}>
              {STATUS_LABEL[item.status]}
            </span>
            {item.status === 'pending' && (
              <button
                onClick={() => onRemove(item.id)}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
