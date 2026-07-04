interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (val: number) => void
}

export function SimulatorSlider({ label, value, min, max, step, unit = 'DH', onChange }: Props) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-sm text-slate-600">{label}</label>
        <span className="text-sm font-bold text-blue-700">
          {value.toLocaleString('fr-FR')} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{min.toLocaleString('fr-FR')}</span>
        <span>{max.toLocaleString('fr-FR')}</span>
      </div>
    </div>
  )
}
