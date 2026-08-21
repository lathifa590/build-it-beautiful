import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Workspace } from "@/types/workspace";

// Import actual steps
import { StepCpTp } from "./StepCpTp";
import { StepProta } from "./StepProta";
import { StepProsem } from "./StepProsem";
import { StepMeeting } from "./StepMeeting";

interface WorkspacePlanningViewProps {
  workspace: Workspace;
  onExit: () => void;
}

export const WorkspacePlanningView: React.FC<WorkspacePlanningViewProps> = ({ workspace, onExit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const steps = [
    { id: 1, title: "CP & TP" },
    { id: 2, title: "Prota" },
    { id: 3, title: "Prosem" },
    { id: 4, title: "Pertemuan" }
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">Perencanaan Pembelajaran</h1>
            <p className="text-sm text-muted-foreground">{workspace.name}</p>
          </div>
        </div>
        
        {/* Stepper indicator */}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border
                  ${currentStep === step.id ? 'bg-primary text-primary-foreground border-primary' : 
                    currentStep > step.id ? 'bg-primary/10 text-primary border-primary/20' : 
                    'bg-slate-50 text-slate-400 border-slate-200'}`}
              >
                {step.id}
              </div>
              <span className={`text-sm font-medium hidden md:inline-block ${currentStep === step.id ? 'text-slate-900' : 'text-slate-500'}`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-slate-200 mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full px-4 md:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[500px] flex flex-col w-full">
          <div className="flex-1">
            {currentStep === 1 && <StepCpTp workspace={workspace} onNext={() => setCurrentStep(2)} />}
            {currentStep === 2 && <StepProta workspace={workspace} onNext={() => setCurrentStep(3)} />}
            {currentStep === 3 && <StepProsem workspace={workspace} onNext={() => setCurrentStep(4)} />}
            {currentStep === 4 && <StepMeeting workspace={workspace} onNext={onExit} />}
          </div>

          {/* Footer Controls (Hanya untuk navigasi mundur, maju dihandle di dalam step) */}
          <div className="mt-8 pt-4 border-t flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Kembali
            </Button>
            
            <div className="text-sm text-muted-foreground self-center">
              Lengkapi data di atas lalu klik "Simpan & Lanjut"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
