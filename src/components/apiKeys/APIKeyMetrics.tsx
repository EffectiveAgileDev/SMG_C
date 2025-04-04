import { format } from 'date-fns';
import { APIKeyMetricsProps } from './types';
import { Card } from '../ui/card';
import { AlertTriangle } from 'lucide-react';

const ERROR_RATE_THRESHOLD = 0.1; // 10%

interface MetricCardSectionProps {
  title: string;
  testId: string;
  children: React.ReactNode;
}

function MetricCardSection({ title, testId, children }: MetricCardSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div data-testid={testId} className="mt-1">
        {children}
      </div>
    </div>
  );
}

export function APIKeyMetrics({ apiKey, usageCount, errorRate, lastUsed }: APIKeyMetricsProps) {
  const formattedErrorRate = `${Math.round(errorRate * 100)}%`;
  const showWarning = errorRate >= ERROR_RATE_THRESHOLD;
  
  // Use the lastUsed from the apiKey if no direct lastUsed is provided
  const effectiveLastUsed = lastUsed || (apiKey?.lastUsed ? new Date(apiKey.lastUsed) : undefined);
  const formattedLastUsed = effectiveLastUsed ? format(effectiveLastUsed, 'h:mm aa') : 'Never';

  return (
    <Card className="p-4">
      <div className="grid grid-cols-3 gap-4">
        <MetricCardSection title="Usage Count" testId="usage-count">
          <p className="text-2xl font-semibold">{usageCount}</p>
        </MetricCardSection>

        <MetricCardSection title="Error Rate" testId="error-rate">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold">{formattedErrorRate}</p>
            {showWarning && (
              <AlertTriangle
                data-testid="error-warning"
                className="h-5 w-5 text-yellow-500"
              />
            )}
          </div>
        </MetricCardSection>

        <MetricCardSection title="Last Used" testId="last-used">
          <p className="text-2xl font-semibold">{formattedLastUsed}</p>
        </MetricCardSection>
      </div>

      <div className="mt-4" data-testid="usage-trend">
        {/* Placeholder for usage trend graph */}
        <div className="h-32 bg-gray-100 rounded-lg"></div>
      </div>
    </Card>
  );
} 