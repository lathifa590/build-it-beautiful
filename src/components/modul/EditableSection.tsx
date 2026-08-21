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
    <div
      className="relative group/editable"
      style={{ position: 'relative' }}
    >
      {/* Subtle highlight border on hover */}
      <div className="absolute inset-0 rounded pointer-events-none ring-0 group-hover/editable:ring-2 group-hover/editable:ring-primary/30 transition-all duration-150" />
      {children}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(sectionId, sectionLabel, currentContent);
        }}
        className="absolute top-1 right-1 z-10 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded shadow-md opacity-0 group-hover/editable:opacity-100 transition-all duration-150 hover:scale-105 print:hidden"
        title={`Edit ${sectionLabel}`}
        aria-label={`Edit ${sectionLabel}`}
      >
        <Pencil className="w-3 h-3" />
        Edit
      </button>
    </div>
  );
};
