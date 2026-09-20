import { Loader2 } from "lucide-react";

export const PageLoader = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-transparent">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
};
