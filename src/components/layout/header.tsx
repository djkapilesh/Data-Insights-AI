import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

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
        <a href="mailto:vikas@bulba.app?subject=Data%20Insights%20AI%20-%20Links&body=WebApp%20Link%3A%20[INSERT_APP_URL]%0AGitHub%20Repo%3A%20[INSERT_GITHUB_REPO_URL]">
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Email Results
          </Button>
        </a>
      </div>
    </header>
  );
}
