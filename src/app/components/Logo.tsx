import { Check } from "lucide-react";

export function Logo({ withWordmark = true, size = 40 }: { withWordmark?: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0 rotate-[-4deg]" style={{ width: size, height: size }}>
        <div
          className="border-ink bg-sunny absolute rounded-[32%] border-[2.5px]"
          style={{ width: size * 0.72, height: size * 0.72, left: 0, top: 0 }}
        />
        <div
          className="border-ink absolute grid place-items-center rounded-[32%] border-[2.5px] bg-primary"
          style={{
            width: size * 0.72,
            height: size * 0.72,
            right: 0,
            bottom: 0,
          }}
        >
          <Check size={size * 0.4} strokeWidth={3.5} className="text-primary-foreground" />
        </div>
      </div>
      {withWordmark && (
        <span className="font-display text-3xl font-bold tracking-tight text-foreground">Sync</span>
      )}
    </div>
  );
}
