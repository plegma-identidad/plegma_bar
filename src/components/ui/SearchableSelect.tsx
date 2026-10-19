import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  autoFocusSearch?: boolean;
  dropdownPlacement?: 'auto' | 'top' | 'bottom';
}

// Normaliza texto quitando tildes y pasando a minúsculas
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar insumo...',
  disabled = false,
  className = '',
  error = false,
  autoFocusSearch = true,
  dropdownPlacement = 'auto',
}) => {
  const { branding } = useApp();
  const radiusClass = branding?.buttonRadius || 'rounded-xl';

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpwards: boolean } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Opción actualmente seleccionada
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Filtrado reactivo en tiempo real sin importar tildes ni mayúsculas
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const cleanQuery = normalizeText(searchTerm);
    return options.filter((opt) => {
      const matchLabel = normalizeText(opt.label).includes(cleanQuery);
      const matchSublabel = opt.sublabel ? normalizeText(opt.sublabel).includes(cleanQuery) : false;
      return matchLabel || matchSublabel;
    });
  }, [options, searchTerm]);

  // Cálculo de coordenadas en pantalla para el Portal (inmune a tablas, tfoot y overflows)
  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUpwards =
      dropdownPlacement === 'top' ||
      (dropdownPlacement === 'auto' && spaceBelow < 280 && rect.top > 250);

    setCoords({
      top: shouldOpenUpwards ? rect.top : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUpwards: shouldOpenUpwards,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    }
  }, [isOpen, dropdownPlacement]);

  // Cierre al hacer clic fuera del componente o del menú portal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Enfoque automático del input de búsqueda al abrir
  useEffect(() => {
    if (isOpen && autoFocusSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, autoFocusSearch]);

  // Manejador de teclado (Escape para cerrar)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="relative w-full text-slate-800" onKeyDown={handleKeyDown}>
      {/* Botón Principal Disparador */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-10 px-3 py-2 text-xs md:text-sm bg-white border ${radiusClass} shadow-xs text-left flex items-center justify-between gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
          error ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'} ${className}`}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-slate-900 truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-slate-500 font-medium truncate">
                  ({selectedOption.sublabel})
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
              title="Limpiar selección"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
        </div>
      </button>

      {/* Menú Desplegable Flotante Montado en Portal al document.body (Por Encima de Todo) */}
      {isOpen && coords && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: coords.openUpwards ? undefined : `${coords.top}px`,
            bottom: coords.openUpwards ? `${window.innerHeight - coords.top + 4}px` : undefined,
            left: `${coords.left}px`,
            width: `${Math.max(coords.width, 280)}px`,
            zIndex: 99999,
          }}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
        >
          {/* Input de Búsqueda */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none py-1"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista de Opciones */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 text-xs">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No se encontraron coincidencias para "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full p-2.5 text-left flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-amber-50/70 text-amber-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate text-xs font-semibold text-slate-900">
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
