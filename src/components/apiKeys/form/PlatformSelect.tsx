import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import type { PlatformType } from '../../../lib/apiKeys/types';

interface PlatformSelectProps {
  value: PlatformType;
  onValueChange: (value: PlatformType) => void;
  disabled?: boolean;
}

export function PlatformSelect({ value, onValueChange, disabled }: PlatformSelectProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="platformType">Platform</label>
      <Select
        value={value}
        onValueChange={(newValue: PlatformType) => {
          onValueChange(newValue);
        }}
        disabled={disabled}
        name="platformType"
      >
        <SelectTrigger 
          id="platformType" 
          aria-label="Platform"
          className="w-full"
          data-testid="platform-select"
        >
          <SelectValue>
            {value === 'twitter' && 'Twitter'}
            {value === 'linkedin' && 'LinkedIn'}
            {value === 'openai' && 'OpenAI'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="twitter">Twitter</SelectItem>
          <SelectItem value="linkedin">LinkedIn</SelectItem>
          <SelectItem value="openai">OpenAI</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 