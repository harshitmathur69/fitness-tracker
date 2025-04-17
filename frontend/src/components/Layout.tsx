
import { ReactNode } from "react";
import Header from "./Header";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
}

export default function Layout({ children, hideHeader = false }: LayoutProps) {
  // Safe way to check if we're in a router context
  let location = null;
  try {
    location = useLocation();
  } catch (error) {
    // If useLocation throws, we're outside router context
    // We'll handle this gracefully
  }

  return (
    <div className="flex min-h-screen flex-col">
      {!hideHeader && location !== null && <Header />}
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} AI Gym Tracker. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="transition hover:text-foreground">Terms</a>
            <a href="#" className="transition hover:text-foreground">Privacy</a>
            <a href="#" className="transition hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
