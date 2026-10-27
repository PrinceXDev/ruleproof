import { ChevronRight, Menu, ShieldCheck } from 'lucide-react';

const WorkspaceBar = ({ onOpenNavigation }: { onOpenNavigation: () => void }) => (
  <header className="flex items-center gap-2 border-b border-border bg-canvas/80 px-4 py-4 text-sm text-ink-muted sm:px-6">
    <button
      type="button"
      onClick={onOpenNavigation}
      aria-label="Open navigation"
      className="mr-1 rounded p-1 hover:text-ink md:hidden"
    >
      <Menu size={18} />
    </button>
    <ShieldCheck size={16} className="text-brand" />
    Authorization
    <ChevronRight size={14} className="text-ink-faint" />
    <span className="text-ink">Workbench</span>
    <span className="ml-auto hidden text-xs text-ink-faint sm:inline">Define. Review. Verify.</span>
  </header>
);
export default WorkspaceBar;
