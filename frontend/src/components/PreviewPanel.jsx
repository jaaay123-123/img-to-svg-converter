export default function PreviewPanel({ originalUrl, svgContent }) {
  const svgBlob = svgContent
    ? URL.createObjectURL(new Blob([svgContent], { type: 'image/svg+xml' }))
    : null

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">원본</p>
        <div className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50 aspect-square flex items-center justify-center">
          {originalUrl
            ? <img src={originalUrl} alt="original" className="max-w-full max-h-full object-contain" />
            : <span className="text-sm text-gray-300">없음</span>}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">SVG 결과</p>
        <div className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50 aspect-square flex items-center justify-center">
          {svgBlob
            ? <img src={svgBlob} alt="svg result" className="max-w-full max-h-full object-contain" />
            : <span className="text-sm text-gray-300">변환 전</span>}
        </div>
      </div>
    </div>
  )
}
