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
  
  // Auto-detect if user is admin based on role
  const isUserAdmin = user?.role === 'admin' || isAdmin;

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/league-rules", label: "League Rules" },
    { href: "/teams", label: "Teams" },
    { href: "/schedule", label: "Schedule & Results" },
    { href: "/stats", label: "Stats" },
    { href: "/suspensions", label: "Suspensions" },
    { href: "/standings", label: "Standings" },
    { href: "/register", label: "Registration" },
    { href: "/referee-scorekeeper", label: "Referee/Scorekeeper" },
    { href: "/player-portal", label: "Player Portal", highlight: true },
  ];

  // For admins, show public links but add Admin Portal at the beginning
  const links = isUserAdmin 
    ? [{ href: "/admin", label: "Admin Portal", highlight: true }, ...publicLinks]
    : publicLinks;

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
      <div className="container">
        <div className="flex items-center justify-between h-auto min-h-16 py-2">
          {/* Logo */}
          <Link href="/">
            <span className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition cursor-pointer">
              <img src="/manus-storage/mihl-league-logo_5025857d.png" alt="MIHL Logo" className="w-12 h-12 object-contain" />
              <span className="hidden sm:inline text-lg">MIHL</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0 flex-wrap justify-center flex-1 mx-4">
            {links.map((link: any) => (
              <Link key={link.href} href={link.href}>
                <span className={`px-3 py-2 rounded-md text-xs lg:text-sm font-medium hover:bg-primary-foreground/10 transition cursor-pointer whitespace-nowrap ${
                  link.highlight ? 'bg-secondary text-secondary-foreground font-bold' : ''
                }`}>
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Auth & Mobile Menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isAuthenticated && user ? (
              <>
                <span className="hidden lg:inline text-xs lg:text-sm">{user.name}</span>
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
              className="lg:hidden p-2 rounded-md hover:bg-primary-foreground/10 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden pb-4 border-t border-primary-foreground/20">
            {links.map((link: any) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`block px-3 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-primary-foreground/10 transition cursor-pointer ${
                    link.highlight ? 'bg-secondary text-secondary-foreground font-bold' : ''
                  }`}
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
