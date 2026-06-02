import { useState, useEffect } from 'react'

export default function ResultCard({ item }) {
  const [copied, setCopied] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [previewTarget, setPreviewTarget] = useState(null) // 'original' | 'svg' | null

  useEffect(() => {
    if (!previewTarget) return
    const onKey = (e) => { if (e.key === 'Escape') setPreviewTarget(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewTarget])

  if (item.status !== 'done' || !item.svgContent) return null

  const originalUrl = URL.createObjectURL(item.file)
  const svgBlob = new Blob([item.svgContent], { type: 'image/svg+xml' })
  const svgUrl = URL.createObjectURL(svgBlob)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.svgContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = svgUrl
    a.download = item.filename
    a.click()
  }

  return (
    <>
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          {[
            { url: originalUrl, alt: '원본', target: 'original', bg: 'bg-gray-50' },
            { url: svgUrl, alt: 'SVG', target: 'svg', bg: 'bg-white' },
          ].map(({ url, alt, target, bg }) => (
            <div
              key={target}
              className={`${bg} p-4 flex items-center justify-center aspect-video relative group cursor-zoom-in`}
              onClick={() => setPreviewTarget(target)}
            >
              <img src={url} alt={alt} className="max-h-full max-w-full object-contain" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                  {alt} 크게 보기
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm text-gray-600 truncate">{item.filename}</span>
            {item.similarity != null && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${item.similarity >= 99 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                유사도 {item.similarity}%
              </span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setPreviewTarget('svg')}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              미리보기
            </button>
            <button
              onClick={() => setShowCode(!showCode)}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showCode ? '코드 닫기' : 'SVG 코드'}
            </button>
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? '복사됨' : '복사'}
            </button>
            <button
              onClick={handleDownload}
              className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              다운로드
            </button>
          </div>
        </div>

        {showCode && (
          <div className="border-t border-gray-50 bg-gray-50 p-4 max-h-48 overflow-auto">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">{item.svgContent}</pre>
          </div>
        )}
      </div>

      {previewTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setPreviewTarget(null)}
        >
          <div
            className="relative bg-white rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTarget('original')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${previewTarget === 'original' ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                >
                  원본
                </button>
                <button
                  onClick={() => setPreviewTarget('svg')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${previewTarget === 'svg' ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                >
                  SVG
                </button>
              </div>
              <div className="flex gap-2">
                {previewTarget === 'svg' && (
                  <button
                    onClick={handleDownload}
                    className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    다운로드
                  </button>
                )}
                <button
                  onClick={() => setPreviewTarget(null)}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-50">
              <img
                src={previewTarget === 'svg' ? svgUrl : originalUrl}
                alt={previewTarget === 'svg' ? 'SVG 미리보기' : '원본 미리보기'}
                className="max-w-full max-h-full object-contain"
                style={{ minHeight: '300px' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
