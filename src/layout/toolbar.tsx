import { Menu } from 'lucide-react';

interface ToolbarProps {
  onMenuToggle: () => void;
}

export function Toolbar({ onMenuToggle }: ToolbarProps) {
  return (
    <header className="flex items-center px-4 py-2 bg-white border-b border-sr-border min-h-12 md:hidden">
      <button
        onClick={onMenuToggle}
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
      >
        <Menu className="h-5 w-5" />
      </button>
    </header>
  );
}
