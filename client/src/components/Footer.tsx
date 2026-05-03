import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* League Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">The Mensches Ice Hockey League</h3>
            <p className="text-primary-foreground/80 text-sm">
              A recreational ice hockey league dedicated to bringing the community together through the sport of hockey.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <a href="mailto:registration@mihl.ca" className="hover:text-secondary transition">
                  registration@mihl.ca
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <a href="tel:+15149652842" className="hover:text-secondary transition">
                  514-965-2842
                </a>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Registration Deadline */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 mb-4 text-center text-sm bg-primary-foreground/5 p-4 rounded">
          <p className="text-primary-foreground font-semibold mb-1">Registration Deadline: June 9, 2026</p>
          <p className="text-primary-foreground/80 text-xs">Register before the deadline to secure your spot for the 2026 summer season</p>
        </div>

        <div className="text-center text-sm text-primary-foreground/60">
          <p>&copy; 2026 The Mensches Ice Hockey League. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
