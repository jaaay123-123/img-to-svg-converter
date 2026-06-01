import { useState, useCallback } from 'react'
import axios from 'axios'
import JSZip from 'jszip'
import UploadZone from './components/UploadZone'
import FileQueue from './components/FileQueue'
import ResultCard from './components/ResultCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let idCounter = 0

export default function App() {
  const [queue, setQueue] = useState([])
  const [converting, setConverting] = useState(false)

  const handleFiles = useCallback((accepted) => {
    const newItems = accepted.map((file) => ({
      id: ++idCounter,
      file,
      status: 'pending',
      svgContent: null,
      filename: null,
      similarity: null,
    }))
    setQueue((prev) => [...prev, ...newItems])
  }, [])

  const handleRemove = useCallback((id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleConvert = async () => {
    const pending = queue.filter((item) => item.status === 'pending')
    if (pending.length === 0) return

    setConverting(true)

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'converting' } : q))
      )

      try {
        const formData = new FormData()
        formData.append('file', item.file)

        const { data } = await axios.post(`${API_URL}/convert`, formData)

        if (data.success) {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: 'done', svgContent: data.svg_content, filename: data.filename, similarity: data.similarity }
                : q
            )
          )
        } else {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'error' } : q))
          )
        }
      } catch {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'error' } : q))
        )
      }
    }

    setConverting(false)
  }

  const handleDownloadAll = async () => {
    const done = queue.filter((item) => item.status === 'done')
    if (done.length === 0) return

    const zip = new JSZip()
    done.forEach((item) => zip.file(item.filename, item.svgContent))
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'svg-results.zip'
    a.click()
  }

  const pendingCount = queue.filter((q) => q.status === 'pending').length
  const doneItems = queue.filter((q) => q.status === 'done')

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-8 py-5">
        <h1 className="text-xl font-semibold tracking-tight">Image → SVG</h1>
        <p className="text-sm text-gray-400 mt-0.5">이미지를 고품질 SVG 벡터로 자동 변환</p>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-8 space-y-6">
        <UploadZone onFiles={handleFiles} />
        <FileQueue files={queue} onRemove={handleRemove} />

        {queue.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={handleConvert}
              disabled={converting || pendingCount === 0}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {converting ? '최적 품질 탐색 중...' : `변환 시작 (${pendingCount}개)`}
            </button>
            {doneItems.length > 0 && (
              <button
                onClick={handleDownloadAll}
                className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ZIP 전체 다운로드
              </button>
            )}
          </div>
        )}

        {doneItems.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">결과</h2>
            {doneItems.map((item) => (
              <ResultCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
