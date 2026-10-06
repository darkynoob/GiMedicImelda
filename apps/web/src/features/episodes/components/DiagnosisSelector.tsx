import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../auth/hooks/auth-context';
import { searchIcd10, type Icd10CatalogEntry } from '../api/catalog.service';
import { Input } from '../../../components/ui/input';

type DiagnosisValue = {
  code?: string;
  description?: string;
};

type DiagnosisSelectorProps = {
  value: DiagnosisValue;
  onChange: (value: DiagnosisValue) => void;
  label?: string;
  placeholder?: string;
};

/// Selector CIE-10 compartido (regla 0.7): busca en el catálogo y guarda código + descripción,
/// nunca un código libre independiente. Si el catálogo aún no tiene datos, permite capturar la
/// descripción manualmente mientras se importa el dataset (ver `npm run catalog:seed:icd10`).
export function DiagnosisSelector({ value, onChange, label, placeholder }: DiagnosisSelectorProps) {
  const { session } = useAuth();
  const [query, setQuery] = useState(value.description ?? '');
  const [results, setResults] = useState<Icd10CatalogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value.description ?? '');
  }, [value.description]);

  useEffect(() => {
    if (!session || !isOpen || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      searchIcd10(session.accessToken, query)
        .then(setResults)
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, isOpen, session]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative space-y-1" ref={containerRef}>
      {label ? <span className="text-xs font-medium text-muted-foreground">{label}</span> : null}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            onChange({ code: value.code, description: event.target.value });
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder ?? 'Buscar diagnóstico CIE-10...'}
          value={query}
        />
      </div>
      {value.code ? (
        <p className="text-xs text-muted-foreground">CIE-10: {value.code}</p>
      ) : null}
      {isOpen && results.length > 0 ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((entry) => (
            <button
              className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-slate-50"
              key={entry.id}
              onClick={() => {
                onChange({ code: entry.code, description: entry.description });
                setQuery(entry.description);
                setIsOpen(false);
              }}
              type="button"
            >
              <span className="font-medium text-slate-900">{entry.code}</span>{' '}
              <span className="text-slate-600">{entry.description}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
