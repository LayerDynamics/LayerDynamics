import React from 'react';
import Navbar from '@/components/sections/Nav/Navbar';
import { ThemeProvider } from '@/components/theme-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/toaster';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="layerdynamics-theme">
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        
        <ScrollArea className="flex-grow">
          <main className="flex-grow">
            {children}
          </main>
          
          <footer className="py-8 border-t">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">LayerDynamics</h3>
                  <p className="text-muted-foreground">
                    Advancing AI and web development solutions.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Navigation</h3>
                  <ul className="space-y-2">
                    <li><a href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</a></li>
                    <li><a href="/projects" className="text-muted-foreground hover:text-primary transition-colors">Projects</a></li>
                    <li><a href="/about" className="text-muted-foreground hover:text-primary transition-colors">About</a></li>
                    <li><a href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Connect</h3>
                  <div className="flex space-x-4">
                    <a href="https://github.com" aria-label="GitHub" className="text-muted-foreground hover:text-primary transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                    </a>
                    <a href="https://twitter.com" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                    </a>
                    <a href="https://linkedin.com" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} LayerDynamics. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </ScrollArea>
        
        <Toaster />
      </div>
    </ThemeProvider>
  );
};

export default Layout;
