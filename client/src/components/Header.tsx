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
  
  // Only allow sarzouan@gmail.com to access admin portal
  const isUserAdmin = (user?.email === 'sarzouan@gmail.com') || isAdmin;

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
    { href: "/staff-portal", label: "Staff Portal", highlight: true },
  ];

  // For admins (sarzouan@gmail.com only), show public links but add Admin Portal at the beginning
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
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663601380927/Fde3d448vCxuYB8KePk65W/mihl-logo-enhanced-d8PvJfyTj2TDGtfaFgsK8z.webp" alt="The Mensches Ice Hockey League Logo" className="w-12 h-12 object-contain" />
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
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  Login
                </Button>
              </Link>
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
