import { Link } from 'react-router-dom';
import { Wrench, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Wrench className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                JVW <span className="text-primary">Trading</span>
              </span>
            </div>
            <p className="text-sm text-secondary-foreground/70">
              Uw betrouwbare partner voor nieuw en gebruikt gereedschap. Kwaliteit voor elke klus.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Snelle Links</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/producten" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                Producten
              </Link>
              <Link to="/inkoop" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                Wij Kopen In
              </Link>
              <Link to="/over-ons" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                Over Ons
              </Link>
              <Link to="/contact" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold">Categorieën</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/producten?category=handgereedschap" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                Handgereedschap
              </Link>
              <Link to="/producten?category=elektrisch" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                Elektrisch Gereedschap
              </Link>
              <Link to="/producten?category=machines" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                Machines
              </Link>
              <Link to="/producten?category=accessoires" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                Accessoires
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-secondary-foreground/70">
                <Mail className="h-4 w-4" />
                <span>info@jvwtrading.nl</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary-foreground/70">
                <Phone className="h-4 w-4" />
                <span>+31 6 12345678</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary-foreground/70">
                <MapPin className="h-4 w-4" />
                <span>Nederland</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-secondary-foreground/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/50">
            © {new Date().getFullYear()} JVW Trading. Alle rechten voorbehouden.
          </p>
          <div className="flex gap-4 text-sm text-secondary-foreground/50">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/voorwaarden" className="hover:text-primary transition-colors">
              Algemene Voorwaarden
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
