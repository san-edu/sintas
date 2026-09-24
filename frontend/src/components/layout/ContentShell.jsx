export default function ContentShell({ children, className = '', ...props }) {
  return (
    <div className={`w-full px-4 sm:px-0 max-w-sm mx-auto ${className}`} {...props}>
      {children}
    </div>
  )
}