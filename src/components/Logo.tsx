import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 px-2 py-1", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-700 text-white shadow-md shadow-rose-900/20">
        <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
      </div>
      {showWord && (
        <div className="flex flex-col min-w-0">
          <span className="text-base font-bold tracking-tight text-foreground leading-none">
            Dakshata<span className="text-rose-500">Connect</span>
          </span>
          <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase leading-none mt-1">
            MoES Capacity Portal
          </span>
        </div>
      )}
    </div>
  );
}
