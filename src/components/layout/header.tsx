import { Logo } from '@/components/icons';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold text-foreground font-headline">
            Data Insights AI
          </h1>
        </div>
      </div>
    </header>
  );
}
