import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="text-7xl font-bold text-text-tertiary">404</div>
      <p className="text-lg text-text-secondary">Page not found</p>
      <p className="text-sm text-text-tertiary max-w-sm text-center">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button variant="outline" render={<Link to="/dashboard" />}>
        <Home size={14} />
        Back to Dashboard
      </Button>
    </div>
  );
}
