import type { ReactNode } from 'react';
import Link from 'next/link';
import Logo from '../landing/Logo';

const ReportShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-dvh bg-canvas text-ink">
    <header className="border-b border-border print:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" aria-label="RuleProof home">
          <Logo />
        </Link>
        <Link
          href="/studio"
          className="rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium text-brand-ink hover:opacity-90"
        >
          Open studio
        </Link>
      </div>
    </header>
    <main>{children}</main>
  </div>
);

export default ReportShell;
