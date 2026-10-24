import { Link } from 'wouter';
import { EmptyState } from '@/components/bits';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <EmptyState icon={<Compass className="h-8 w-8" />} title="Wrong turn" body="This page does not exist. Let's get you back to learning.">
      <Link href="/" data-testid="link-home" className="chunk chunk-green">Back to lessons</Link>
    </EmptyState>
  );
}
