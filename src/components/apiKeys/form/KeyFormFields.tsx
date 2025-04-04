import { Input } from '../../ui/input';

interface KeyFormFieldsProps {
  keyName: string;
  keyValue: string;
  onKeyNameChange: (value: string) => void;
  onKeyValueChange: (value: string) => void;
  isRotating?: boolean;
  disabled?: boolean;
}

export function KeyFormFields({
  keyName,
  keyValue,
  onKeyNameChange,
  onKeyValueChange,
  isRotating = false,
  disabled = false,
}: KeyFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="keyName">Key Name</label>
        <Input
          id="keyName"
          name="keyName"
          value={keyName}
          onChange={(e) => onKeyNameChange(e.target.value)}
          disabled={isRotating || disabled}
          placeholder="Enter a name for this API key"
          aria-label="Key Name"
          data-testid="key-name-input"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="keyValue">{isRotating ? 'New API Key' : 'API Key'}</label>
        <Input
          id="keyValue"
          name="keyValue"
          type="text"
          value={keyValue}
          onChange={(e) => onKeyValueChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter your API key"
          aria-label={isRotating ? 'New API Key' : 'API Key'}
          data-testid="key-value-input"
        />
      </div>
    </>
  );
} 