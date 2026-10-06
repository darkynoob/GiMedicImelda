import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import type { MedicationOrderItem } from '../api/clinical-history.service';

const routeOptions = [
  'Oral',
  'Intravenosa',
  'Intramuscular',
  'Subcutánea',
  'Tópica',
  'Inhalada',
  'Oftálmica',
  'Ótica',
  'Rectal',
  'Vaginal',
  'Sublingual',
  'Otra',
];

type MedicationOrderInputProps = {
  items: MedicationOrderItem[];
  onChange: (items: MedicationOrderItem[]) => void;
  addLabel?: string;
};

/// Colección repetible de medicamentos estructurados (regla 0.7), reutilizada por Historia
/// clínica, Consulta actual, Evolución y Receta en lugar de un textarea libre.
export function MedicationOrderInput({ items, onChange, addLabel }: MedicationOrderInputProps) {
  const updateItem = (index: number, patch: Partial<MedicationOrderItem>) => {
    const next = items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-6" key={item.id ?? index}>
          <Input
            className="sm:col-span-2"
            onChange={(event) => updateItem(index, { medication: event.target.value })}
            placeholder="Medicamento"
            value={item.medication ?? ''}
          />
          <Input
            onChange={(event) => updateItem(index, { dose: event.target.value ? Number(event.target.value) : undefined })}
            placeholder="Dosis"
            type="number"
            value={item.dose ?? ''}
          />
          <Input
            onChange={(event) => updateItem(index, { unit: event.target.value })}
            placeholder="Unidad"
            value={item.unit ?? ''}
          />
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(event) => updateItem(index, { route: event.target.value })}
            value={item.route ?? ''}
          >
            <option value="">Vía</option>
            {routeOptions.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </select>
          <Input
            onChange={(event) => updateItem(index, { frequency: event.target.value })}
            placeholder="Frecuencia"
            value={item.frequency ?? ''}
          />
          <Input
            className="sm:col-span-2"
            onChange={(event) => updateItem(index, { duration: event.target.value })}
            placeholder="Duración"
            value={item.duration ?? ''}
          />
          <Input
            className="sm:col-span-3"
            onChange={(event) => updateItem(index, { indication: event.target.value })}
            placeholder="Indicación"
            value={item.indication ?? ''}
          />
          <Button
            className="justify-self-end text-destructive"
            onClick={() => removeItem(index)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        onClick={() => onChange([...items, {}])}
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus className="mr-1 h-4 w-4" />
        {addLabel ?? 'Agregar medicamento'}
      </Button>
    </div>
  );
}
