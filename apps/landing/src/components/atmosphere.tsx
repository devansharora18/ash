/**
 * Fixed, non-interactive page atmosphere: warm wash, ruled stock, paper grain.
 * Pure CSS (see index.css) so it costs one static layer and no JavaScript.
 */
function Atmosphere() {
  return (
    <>
      <div aria-hidden="true" className="atmosphere" />
      <div aria-hidden="true" className="grain" />
    </>
  )
}

export default Atmosphere
