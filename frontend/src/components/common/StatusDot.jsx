export default function StatusDot({ isPresent, text }) {
  const label =
    text ?? `Anda ${isPresent ? 'sudah' : 'belum'} absen hari ini.`

  return (
    <div className="flex py-4 gap-2 items-center">
      <div
        aria-hidden="true"
        className={`rounded-full h-2 p-2 shrink-0 ${
          isPresent ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="pb-[3.5px]">{label}</span>
    </div>
  )
}