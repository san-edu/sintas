import { useState } from 'react'
import ChevronLeftSharpIcon from '@mui/icons-material/ChevronLeftSharp'
import ChevronRightSharpIcon from '@mui/icons-material/ChevronRightSharp'

export default function BannerCarousel({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [broken, setBroken] = useState(false)

  // State untuk mencegah spam klik
  const [isClickable, setIsClickable] = useState(true)

  if (!items || items.length === 0) return null

  const handleSlideChange = (direction) => {
    if (!isClickable) return
    setIsClickable(false)
    setBroken(false)

    if (direction === 'next') {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
    } else {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length)
    }

    setTimeout(() => {
      setIsClickable(true)
    }, 250)
  }

  const currentItem = items[currentIndex]
  const showImage = Boolean(currentItem.imageUrl) && !broken

  const bannerElement = showImage ? (
    <img
      src={currentItem.imageUrl}
      alt={currentItem.title || currentItem.name}
      onError={() => setBroken(true)}
      className="rounded-xl w-full h-38 object-cover select-none"
      draggable={false}
    />
  ) : (
    <div className="rounded-xl w-full h-38 flex flex-col justify-center bg-blue-100 px-5 py-4 select-none">
      <p className="text-heading-sm font-bold text-school-blue-900">
        {currentItem.title}
      </p>
      {currentItem.content ? (
        <p className="mt-1 text-body-md text-ink-700">{currentItem.content}</p>
      ) : null}
    </div>
  )

  return (
    <div className="relative w-full overflow-hidden group select-none bg-black/10">
      <div>{bannerElement}</div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => handleSlideChange('prev')}
            disabled={!isClickable}
            className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center touch-manipulation transition-opacity ${
              !isClickable ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
            }`}
            aria-label="Previous slide"
          >
            <ChevronLeftSharpIcon />
          </button>

          <button
            type="button"
            onClick={() => handleSlideChange('next')}
            disabled={!isClickable}
            className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center touch-manipulation transition-opacity ${
              !isClickable ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
            }`}
            aria-label="Next slide"
          >
            <ChevronRightSharpIcon />
          </button>
        </>
      )}
    </div>
  )
}