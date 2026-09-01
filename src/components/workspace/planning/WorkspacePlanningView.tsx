import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Workspace } from "@/types/workspace";

// Import actual steps
import { StepCpTp } from "./StepCpTp";
import { StepProta } from "./StepProta";
import { StepKktp } from "./StepKktp";
import { StepProsem } from "./StepProsem";
import { StepMeeting } from "./StepMeeting";

interface WorkspacePlanningViewProps {
  onExit: () => void;
  isLocked?: boolean;
  onShowUpsell?: () => void;
}

export const WorkspacePlanningView: React.FC<WorkspacePlanningViewProps> = ({ workspace, onExit, isLocked, onShowUpsell }) => {
  const [searchParams] = useSearchParams();
  const initialStep = Number(searchParams.get("step")) || 1;
  const [currentStep, setCurrentStep] = useState(initialStep);
  const navigate = useNavigate();

  const steps = [
    { id: 1, title: "CP & TP" },
    { id: 2, title: "Prota" },
    { id: 3, title: "KKTP" },
    { id: 4, title: "Prosem" },
    { id: 5, title: "Pertemuan" }
  ];

  return (
    <div className="flex flex-col h-full bg-page-bg">
      {/* Header Tetap Ada */}
      <div className="bg-white border-b-2 border-black px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm shrink-0 gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onExit} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-black text-lg truncate">Perencanaan Pembelajaran</h1>
            <p className="text-sm font-semibold text-muted-foreground truncate">{workspace.name}</p>
          </div>
        </div>

        {/* Horizontal Step Bar di Kanan Atas */}
        <div className="flex items-center gap-1 md:gap-3 overflow-x-auto pb-1 pt-1 hide-scrollbar flex-shrink-0">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;
            const stateClass = isActive ? 'active' : isDone ? 'done' : 'pending';
            
            return (
              <div 
                key={step.id}
                onClick={() => {
                  if (step.id !== 5 || isDone) {
                    setCurrentStep(step.id);
                  }
                }}
                className={`step-item ${stateClass} !border-b-0 shrink-0`}
                style={{ 
                  cursor: (step.id === 5 && currentStep < 5) ? 'not-allowed' : 'pointer',
                  opacity: (step.id === 5 && currentStep < 5) ? 0.5 : 1
                }}
              >
                <div className="step-num">
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span className="whitespace-nowrap hidden sm:inline">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Main Content — flex-1 with overflow-hidden, children manage their own scroll */}
      <div className="flex-1 overflow-hidden w-full">
        {currentStep === 5 ? (
          <div className="h-full overflow-y-auto p-4 md:p-6">
            <div className="max-w-[1400px] mx-auto w-full">
              <StepMeeting workspace={workspace} onNext={onExit} isLocked={isLocked} onShowUpsell={onShowUpsell} />
              <div className="mt-6">
                <button className="btn btn-secondary" onClick={() => setCurrentStep(4)}>Kembali</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col max-w-[1400px] mx-auto w-full">
            <div className="flex-1 flex flex-col overflow-hidden border-2 border-black rounded-xl shadow-lg bg-white m-3 md:m-6">
              {/* Step 1: Two-panel layout, fills full card height */}
              {currentStep === 1 && (
                <div className="flex-1 flex flex-col overflow-y-auto md:overflow-hidden h-full">
                  <StepCpTp workspace={workspace} onNext={() => setCurrentStep(2)} isLocked={isLocked} onShowUpsell={onShowUpsell} />
                </div>
              )}
              {/* Steps 2, 3, & 4: standard padded scroll */}
              {(currentStep === 2 || currentStep === 3 || currentStep === 4) && (
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                  {currentStep === 2 && <StepProta workspace={workspace} onNext={() => setCurrentStep(3)} isLocked={isLocked} onShowUpsell={onShowUpsell} />}
                  {currentStep === 3 && <StepKktp workspace={workspace} onNext={() => setCurrentStep(4)} isLocked={isLocked} onShowUpsell={onShowUpsell} />}
                  {currentStep === 4 && <StepProsem workspace={workspace} onNext={() => setCurrentStep(5)} isLocked={isLocked} onShowUpsell={onShowUpsell} />}
                </div>
              )}
            </div>

            {/* Footer Controls */}
            <div className="page-footer shrink-0 flex items-center justify-between mx-4 md:mx-6 mb-4 rounded-b-xl">
              <span className="text-sm text-muted-foreground">Lengkapi data di atas lalu klik "Simpan & Lanjut".</span>
              <button 
                className="btn btn-secondary" 
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
              >
                Kembali
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
