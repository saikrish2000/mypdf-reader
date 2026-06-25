import { Link } from 'react-router-dom';
import { footerContent } from '@/lib/landing/content';

export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-8">
      <div className="landing-shell py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {footerContent.columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground mb-4">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © {year} mypdf.reader. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">{footerContent.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
