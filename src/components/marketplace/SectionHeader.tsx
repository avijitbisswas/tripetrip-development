import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon?: string;
  href?: string;
}

export default function SectionHeader({ title, subtitle, icon, href = '/search' }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
          {icon && <span aria-hidden="true">{icon}</span>}
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">{subtitle}</p>
      </div>
      <Link
        to={href}
        className="hidden shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 transition-colors hover:text-indigo-800 sm:flex"
      >
        View All
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
