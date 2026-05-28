import { useState } from 'react'

export default function ResultCard({ item }) {
  const [copied, setCopied] = useState(false)
  const [showCode, setShowCode] = useState(false)

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
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="bg-gray-50 p-4 flex items-center justify-center aspect-video">
          <img src={originalUrl} alt="original" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="bg-white p-4 flex items-center justify-center aspect-video">
          <img src={svgUrl} alt="svg" className="max-h-full max-w-full object-contain" />
        </div>
      </div>

      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50">
        <span className="text-sm text-gray-600 truncate">{item.filename}</span>
        <div className="flex gap-2 shrink-0">
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
  )
}
