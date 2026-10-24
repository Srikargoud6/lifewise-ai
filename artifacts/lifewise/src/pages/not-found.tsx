import { Link } from 'wouter';
import { EmptyState } from '@/components/bits';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <EmptyState icon={<Compass className="h-6 w-6" />} title="Off the map" body="This route does not exist in the simulator.">
      <Link href="/" data-testid="link-home" className="inline-block rounded-lg bg-navy px-4 py-2 font-semibold text-white">Back to tracks</Link>
    </EmptyState>
  );
}
