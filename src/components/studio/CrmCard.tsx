/**
 * The animated CRM card: a cursor glides in, clicks, and a selection box closes around the headline.
 * Used on the empty Studio screen and as the preview's loader while a CRM is being built.
 */
export function CrmCard({ className }: { className?: string }) {
  const handles = [[23, 15], [23, 301], [582, 301], [582, 15]] as const
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 614 390" className={className} role="img" aria-label="Sortblink builds a CRM from a sentence">
      <g id="box-crm">
        <g className="crm-text" fill="#f9f9f9" fontFamily="inherit">
          <text x="57" y="100" fontSize="46" fontWeight="600">Your CRM,</text>
          <text x="57" y="158" fontSize="46" fontWeight="600">built from</text>
          <text x="57" y="216" fontSize="46" fontWeight="600">one sentence.</text>
          <text x="57" y="262" fontSize="18" fill="#9aa0a6">Contacts, deals, tasks and reports.</text>
          <text x="57" y="288" fontSize="18" fill="#9aa0a6">Sample data included.</text>
        </g>
        <g className="crm-box">
          <path strokeWidth="2" stroke="#2563EB" fillOpacity="0.05" fill="#2563EB" d="M587 20H28V306H587V20Z" />
          {handles.map(([x, y]) => <path key={`${x}-${y}`} strokeWidth="2" stroke="#2563EB" fill="white" d={`M${x + 10} ${y}H${x}V${y + 10}H${x + 10}V${y}Z`} />)}
        </g>
        <g className="crm-cursor">
          <path strokeWidth="2" stroke="white" fill="#2563EB" d="M453.383 343L448 317L471 331L459.745 333.5L453.383 343Z" />
          <rect x="469.932" y="343" width="117.068" height="33" fill="#2563EB" />
          <text x="528.5" y="364" textAnchor="middle" fontSize="14" fontWeight="500" fill="white" fontFamily="inherit">Sortblink AI</text>
        </g>
      </g>
    </svg>
  )
}
