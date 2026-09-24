import { useLocation, useNavigate } from 'react-router-dom'

export default function BottomNav({ menus }) {
  const navigate = useNavigate()
  const location = useLocation()

  if (!menus || menus.length <= 0) return null

  return (
    <div className="bg-blue-100 rounded-t-[60px] p-4 py-8 w-full -mt-17 fixed bottom-0 z-50 max-w-lg left-1/2 -translate-x-1/2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max min-w-full items-center justify-around gap-1">
        {menus.map((item) => {
          const NavIcon = item.icon
          const isActive = item.end
            ? location.pathname === item.link
            : location.pathname === item.link ||
              location.pathname.startsWith(`${item.link}/`)

          return (
            <button
              key={item.name}
              type="button"
              aria-label={item.name}
              title={item.name}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => navigate(item.link)}
              className={
                (isActive ? 'rounded-2xl bg-blue-500 text-white ' : '') +
                'p-2 h-12 w-12 shrink-0 flex justify-center items-center'
              }
            >
              <NavIcon className="w-8! h-8!" />
            </button>
          )
        })}
      </div>
    </div>
  )
}