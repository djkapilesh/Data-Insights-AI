import Header from '@/components/layout/header';
import ChatInterface from '@/components/chat/chat-interface';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body text-foreground">
      <Header />
      <main className="flex-1 w-full flex flex-col items-center py-6">
        <ChatInterface />
      </main>
    </div>
  );
}
