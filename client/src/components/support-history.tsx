import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart } from 'lucide-react';
import type { Support } from '@shared/schema';

interface SupportHistoryProps {
  artistId: string;
}

export function SupportHistory({ artistId }: SupportHistoryProps) {
  const { data: supports = [], isLoading } = useQuery<Support[]>({
    queryKey: ['/api/artist', artistId, 'supports'],
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (supports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No support yet. Be the first to support this artist!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {supports.map((support) => (
        <Card key={support.id} className="p-4" data-testid={`card-support-${support.id}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="font-semibold text-foreground">
                  ${(support.amount / 100).toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  via {support.paymentMethod}
                </span>
              </div>
              {support.message && (
                <p className="text-sm text-muted-foreground italic">"{support.message}"</p>
              )}
            </div>
            <div className="text-xs text-muted-foreground text-right">
              {new Date(support.createdAt).toLocaleDateString()}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
