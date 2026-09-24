import { useNavigate } from 'react-router-dom'

export default function FeatureGrid({ features, search = '' }) {
  const navigate = useNavigate()

  const query = search.trim().toLowerCase()
  const filteredFeatures = query
    ? features.filter((feature) => feature.name.toLowerCase().includes(query))
    : features

  return (
    <div className="grid grid-cols-3 gap-4 mt-4 border border-black/10 rounded-xl py-8 px-4 bg-white">
      {filteredFeatures.length > 0 ? (
        filteredFeatures.map((feature) => {
          const FeatureIcon = feature.icon

          return (
            <button
              key={feature.name}
              type="button"
              onClick={() => navigate(feature.link)}
              className="flex flex-col items-center justify-center gap-2 text-center"
            >
              <div className="text-blue-500 bg-blue-100 rounded-full h-18 w-18 flex items-center justify-center">
                <FeatureIcon className="w-10! h-10!" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {feature.name}
              </span>
            </button>
          )
        })
      ) : (
        <p className="text-sm text-ink-700">Tidak ada Fitur</p>
      )}
    </div>
  )
}