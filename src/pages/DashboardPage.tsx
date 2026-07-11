import { Link } from 'react-router-dom';
import {
  Building2,
  MapPinned,
  Landmark,
  MessageSquareQuote,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useCollection } from '@/lib/crud';
import { useAuth } from '@/auth/auth-context';
import { PageHeader } from '@/components/PageHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TouristSite, Testimonial } from '@/lib/types';

function StatCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string;
  value: number | string;
  icon: typeof Building2;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardPage() {
  const { user, hasRole } = useAuth();
  const cities = useCollection<unknown>('/cities');
  const sites = useCollection<TouristSite>('/tourist-sites');
  const figures = useCollection<unknown>('/historical-figures');
  const testimonials = useCollection<Testimonial>('/testimonials');

  const isAdmin = hasRole('admin');
  const pendingSites = useCollection<TouristSite>('/tourist-sites/pending', undefined, {
    enabled: isAdmin,
  });
  const pendingTestimonials = useCollection<Testimonial>(
    '/testimonials/pending',
    undefined,
    { enabled: isAdmin },
  );

  const num = (n?: unknown[]) => (n ? n.length : '…');
  const pendingCount =
    (pendingSites.data?.length ?? 0) + (pendingTestimonials.data?.length ?? 0);

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user?.firstname} 👋`}
        description="Vue d'ensemble du contenu de CulturePlus Bénin."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Villes" value={num(cities.data)} icon={Building2} to="/cities" />
        <StatCard label="Sites touristiques" value={num(sites.data)} icon={MapPinned} to="/tourist-sites" />
        <StatCard label="Figures historiques" value={num(figures.data)} icon={Landmark} to="/historical-figures" />
        <StatCard label="Témoignages" value={num(testimonials.data)} icon={MessageSquareQuote} to="/testimonials" />
      </div>

      {isAdmin && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> En attente de validation
              {pendingCount > 0 && (
                <Badge variant="warning">{pendingCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm">
                Sites touristiques :{' '}
                <strong>{pendingSites.data?.length ?? 0}</strong> en attente
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link to="/tourist-sites">
                  Voir <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm">
                Témoignages :{' '}
                <strong>{pendingTestimonials.data?.length ?? 0}</strong> en
                attente
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link to="/testimonials">
                  Voir <ArrowRight />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
