import Link from 'next/link';
import { cn } from '@/lib/cn';
import Logo from '@/components/landing/Logo';
import { FOOTER_ANCHORS, GITHUB_URL } from '@/constants/landing';
import { LANDING_WRAP } from '@/constants/landing-styles';

const Footer = () => (
  <footer className="border-t border-white/[.07]">
    <div className={cn(LANDING_WRAP, 'flex flex-col gap-6 py-10 sm:flex-row sm:items-center')}>
      <Logo />
      <p className="text-sm text-ink-faint">
        Built for <span className="text-ink-muted">No Hands: The Wispr Challenge</span> · WeMakeDevs
        × Wispr Flow
      </p>
      <nav className="flex gap-5 text-sm text-ink-muted sm:ml-auto" aria-label="Footer">
        <Link href="/studio/" className="hover:text-ink">
          Studio
        </Link>
        {FOOTER_ANCHORS.map(([href, label]) => (
          <a key={href} href={href} className="hover:text-ink">
            {label}
          </a>
        ))}
        <a href={GITHUB_URL} className="hover:text-ink">
          GitHub
        </a>
      </nav>
    </div>
  </footer>
);

export default Footer;
