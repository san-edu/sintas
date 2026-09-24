export default function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`bg-blue-500 font-semibold text-lg py-2 w-full rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}