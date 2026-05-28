export default function ConvertOptions({ options, onChange }) {
  const set = (key, value) => onChange({ ...options, [key]: value })

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">변환 설정</h3>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">색상 수</span>
          <span className="text-indigo-600 font-medium">{options.color_count}</span>
        </div>
        <input type="range" min={2} max={30} value={options.color_count}
          onChange={(e) => set('color_count', Number(e.target.value))}
          className="w-full accent-indigo-600" />
        <div className="flex justify-between text-xs text-gray-300">
          <span>2</span><span>30</span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-700">패스 방식</label>
        <select
          value={options.mode}
          onChange={(e) => set('mode', e.target.value)}
          className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="spline">Spline</option>
          <option value="polygon">Polygon</option>
          <option value="none">None</option>
        </select>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">노이즈 제거</span>
          <span className="text-indigo-600 font-medium">{options.filter_speckle}</span>
        </div>
        <input type="range" min={1} max={16} value={options.filter_speckle}
          onChange={(e) => set('filter_speckle', Number(e.target.value))}
          className="w-full accent-indigo-600" />
        <div className="flex justify-between text-xs text-gray-300">
          <span>1</span><span>16</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">색상 레이어 감도</span>
          <span className="text-indigo-600 font-medium">{options.layer_difference}</span>
        </div>
        <input type="range" min={4} max={64} value={options.layer_difference}
          onChange={(e) => set('layer_difference', Number(e.target.value))}
          className="w-full accent-indigo-600" />
        <div className="flex justify-between text-xs text-gray-300">
          <span>4</span><span>64</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700">배경 자동 제거</p>
          <p className="text-xs text-gray-400">rembg 사용</p>
        </div>
        <button
          onClick={() => set('remove_background', !options.remove_background)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            options.remove_background ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            options.remove_background ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </button>
      </div>
    </div>
  )
}
