const Logo = ({ className }: { className?: string }) => (
  <span className={`flex items-center gap-2 ${className ?? ""}`}>
    <svg width="26" height="26" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect width="22" height="22" rx="6.5" fill="#D5F879" />
      <path
        d="M6.5 11.3l2.9 2.9 6.1-6.4"
        stroke="#10120F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <span className="text-[17px] font-semibold tracking-[-0.03em] text-ink">
      RuleProof<span className="text-brand">.</span>
    </span>
  </span>
);

export default Logo;
