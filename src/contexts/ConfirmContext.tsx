import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface PromptOptions extends ConfirmOptions {
  defaultValue?: string;
  inputPlaceholder?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPrompt, setIsPrompt] = useState(false);
  const [options, setOptions] = useState<PromptOptions | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [resolveCallback, setResolveCallback] = useState<((value: any) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setIsPrompt(false);
      setResolveCallback(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const prompt = useCallback((opts: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setIsPrompt(true);
      setInputValue(opts.defaultValue || '');
      setResolveCallback(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveCallback) {
      if (isPrompt) {
        resolveCallback(inputValue);
      } else {
        resolveCallback(true);
      }
    }
    // Clean up slightly after animation
    setTimeout(() => {
      setOptions(null);
      setResolveCallback(null);
    }, 300);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveCallback) {
      if (isPrompt) {
        resolveCallback(null);
      } else {
        resolveCallback(false);
      }
    }
    setTimeout(() => {
      setOptions(null);
      setResolveCallback(null);
    }, 300);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}

      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="w-[95vw] sm:max-w-md rounded-2xl p-5 sm:p-6 gap-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold font-heading">
              {options?.title}
            </AlertDialogTitle>
            {options?.description && (
              <AlertDialogDescription className="text-sm mt-2 leading-relaxed">
                {options.description.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {isPrompt && (
            <div className="py-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={options?.inputPlaceholder}
                className="w-full border-2 border-foreground/30 focus-visible:ring-0 focus-visible:border-primary text-base"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                }}
              />
            </div>
          )}

          <AlertDialogFooter className="sm:space-x-3 gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              className="mt-0 w-full sm:w-auto font-bold border-2"
            >
              {options?.cancelText || 'Batal'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              className={`w-full sm:w-auto font-bold border-2 ${
                options?.variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive'
                  : 'border-primary'
              }`}
            >
              {options?.confirmText || 'Oke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
