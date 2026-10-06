import { Input } from '../../../components/ui/input';

export type VitalSignFieldKey = string;

export type VitalSignFieldDefinition = {
  key: VitalSignFieldKey;
  label: string;
  unit?: string;
  step?: string;
};

type VitalSignsInputProps = {
  fields: VitalSignFieldDefinition[];
  values: Record<string, number | undefined>;
  onChange: (key: string, value: number | undefined) => void;
  /// Claves de peso/talla para mostrar el IMC calculado en solo lectura (spec: "read-only calculado").
  weightKey?: string;
  heightKey?: string;
};

function calculateBmi(weightKg?: number, heightCm?: number): number | null {
  if (!weightKg || !heightCm) return null;
  const heightMeters = heightCm / 100;
  return Math.round((weightKg / (heightMeters * heightMeters)) * 10) / 10;
}

/// Componente compartido de signos vitales (regla 0.7): campos numéricos estructurados con
/// unidad visible, reutilizado por Historia clínica, Consulta actual y Evolución.
export function VitalSignsInput({
  fields,
  values,
  onChange,
  weightKey,
  heightKey,
}: VitalSignsInputProps) {
  const bmi =
    weightKey && heightKey ? calculateBmi(values[weightKey], values[heightKey]) : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {fields.map((field) => (
        <label className="space-y-1" key={field.key}>
          <span className="text-xs font-medium text-muted-foreground">
            {field.label}
            {field.unit ? ` (${field.unit})` : ''}
          </span>
          <Input
            inputMode="decimal"
            onChange={(event) => {
              const raw = event.target.value;
              onChange(field.key, raw === '' ? undefined : Number(raw));
            }}
            step={field.step ?? 'any'}
            type="number"
            value={values[field.key] ?? ''}
          />
        </label>
      ))}
      {weightKey && heightKey ? (
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">IMC (calculado)</span>
          <Input disabled readOnly value={bmi ?? ''} />
        </label>
      ) : null}
    </div>
  );
}
