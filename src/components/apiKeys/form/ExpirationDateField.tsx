import { Input } from '../../ui/input';

interface ExpirationDateFieldProps {
  value?: Date;
  onChange: (value: Date | undefined) => void;
  disabled?: boolean;
}

export function ExpirationDateField({ value, onChange, disabled }: ExpirationDateFieldProps) {
  const handleChange = (inputValue: string) => {
    onChange(inputValue ? new Date(inputValue) : undefined);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="expiresAt">Expiration Date (Optional)</label>
      <Input
        id="expiresAt"
        name="expiresAt"
        type="datetime-local"
        onChange={(e) => handleChange(e.target.value)}
        value={value?.toISOString().slice(0, 16) || ''}
        disabled={disabled}
        aria-label="Expiration Date"
        data-testid="expiration-date-input"
      />
    </div>
  );
} 