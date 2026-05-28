import { useDropzone } from 'react-dropzone'

const ACCEPTED_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp'],
  'image/gif': ['.gif'],
}
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export default function UploadZone({ onFiles }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    onDrop: (accepted) => {
      if (accepted.length > 0) onFiles(accepted)
    },
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        {isDragActive ? (
          <p className="text-indigo-600 font-medium">파일을 여기에 놓으세요</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium">파일을 드래그하거나 클릭해서 업로드</p>
            <p className="text-sm text-gray-400">PNG, JPG, WEBP, BMP, GIF · 파일당 최대 10MB</p>
          </>
        )}
      </div>
    </div>
  )
}
