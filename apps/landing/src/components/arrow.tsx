/** Hairline arrow with square caps — editorial rather than rounded/utility. */
function Arrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      className="h-3.5 w-3.5 transition-transform duration-500 ease-expo group-hover:translate-x-1"
    >
      <path d="M2 8h11M9.5 4.5 13 8l-3.5 3.5" />
    </svg>
  )
}

export default Arrow
