export function Logo({ size = 48 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5C6BFF" />
            <stop offset="100%" stopColor="#8B8FFF" />
          </linearGradient>
        </defs>
        <path d="M12 18C12 15.2386 14.2386 13 17 13H24C26.7614 13 29 15.2386 29 18V22C29 24.7614 26.7614 27 24 27H17C14.2386 27 12 24.7614 12 22V18Z" fill="url(#logoGradient)" opacity="0.6" />
        <path d="M19 21C19 18.2386 21.2386 16 24 16H31C33.7614 16 36 18.2386 36 21V28C36 30.7614 33.7614 33 31 33H24C21.2386 33 19 30.7614 19 28V21Z" fill="url(#logoGradient)" />
        <path d="M27 24L31 28L35 20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-normal">Sync</h1>
        <p className="mt-1 text-sm text-muted-foreground">Stop debating. Start deciding.</p>
      </div>
    </div>
  );
}
