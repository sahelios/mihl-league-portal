import { useState } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface HeaderProps {
  isAdmin?: boolean;
}

export default function Header({ isAdmin = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/league-rules", label: "League Rules" },
    { href: "/teams", label: "Teams" },
    { href: "/schedule", label: "Schedule & Results" },
    { href: "/stats", label: "Stats" },
    { href: "/suspensions", label: "Suspensions" },
    { href: "/standings", label: "Standings" },
    { href: "/register", label: "Registration" },
  ];

  const adminLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/players", label: "Players" },
    { href: "/admin/games", label: "Games" },
    { href: "/admin/news", label: "News" },
    { href: "/admin/stars", label: "Stars" },
    { href: "/admin/suspensions", label: "Suspensions" },
    { href: "/admin/messages", label: "Messages" },
    { href: "/admin/settings", label: "Settings" },
  ];

  const links = isAdmin ? adminLinks : publicLinks;

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <span className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition cursor-pointer">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">⚡</span>
              </div>
              <span className="hidden sm:inline">MIHL</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <span className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 transition cursor-pointer">
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Auth & Mobile Menu */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <span className="hidden sm:inline text-sm">{user.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Login
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-primary-foreground/10 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-primary-foreground/20">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 transition cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
