import { Button } from '@/components/ui/button';
import { ArrowUpDown, Check } from 'lucide-react';

interface SortingToggleProps {
  isSortingMode: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const SortingToggle = ({
  isSortingMode,
  onToggle,
  disabled = false
}: SortingToggleProps) => {
  return (
    <Button
      onClick={onToggle}
      disabled={disabled}
      variant={isSortingMode ? 'default' : 'outline'}
      className={`
        transition-all duration-300
        ${isSortingMode 
          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' 
          : 'bg-white/80 hover:bg-white text-gray-700 backdrop-blur-sm'
        }
      `}
    >
      {isSortingMode ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Modo Organização
        </>
      ) : (
        <>
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Organizar Itens
        </>
      )}
    </Button>
  );
};
