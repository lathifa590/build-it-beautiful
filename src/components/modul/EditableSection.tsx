import React from 'react';
import { Pencil } from 'lucide-react';

interface EditableSectionProps {
  children: React.ReactNode;
  sectionId: string;
  sectionLabel: string;
  currentContent: unknown;
  onEdit: (sectionId: string, sectionLabel: string, currentContent: unknown) => void;
}

export const EditableSection: React.FC<EditableSectionProps> = ({
  children,
  sectionId,
  sectionLabel,
  currentContent,
  onEdit,
}) => {
  return (
    <div className="relative group/editable" style={{ position: 'relative' }}>
      {children}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(sectionId, sectionLabel, currentContent);
        }}
        className="absolute top-1 right-1 z-10 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-primary/80 text-primary-foreground rounded shadow-sm hover:bg-primary transition-all print:hidden"
        title={`Edit ${sectionLabel}`}
      >
        <Pencil className="w-3 h-3" />
        Edit
      </button>
    </div>
  );
};
