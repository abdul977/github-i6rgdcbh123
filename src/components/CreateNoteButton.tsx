import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CreateNoteButtonProps {
  onClick: () => void;
  className?: string;
  children?: ReactNode;
}

export function CreateNoteButton({ 
  onClick, 
  className, 
  children 
}: CreateNoteButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "flex items-center space-x-2 bg-note-800 hover:bg-note-900 text-white",
        className
      )}
    >
      {children || (
        <>
          <Plus className="h-4 w-4" />
          <span>New Note</span>
        </>
      )}
    </Button>
  );
}