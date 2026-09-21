import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserPermissions } from '../../types';
import { Plus, X, Check } from 'lucide-react';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  hint,
  children,
  className = '',
}) => {
  const { branding } = useApp();
  const fontStyle = branding?.fontFamily ? { fontFamily: `'${branding.fontFamily}', sans-serif` } : {};

  return (
    <div className={`space-y-1.5 ${className}`} style={fontStyle}>
      <label className="block text-xs font-semibold text-slate-700 tracking-wide">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-slate-500">{hint}</p>}
      {error && <p className="text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
};

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = '', error, style, ...props }, ref) => {
    const { branding } = useApp();
    const radiusClass = branding?.buttonRadius || 'rounded-xl';
    const customStyle: React.CSSProperties = {
      fontFamily: branding?.fontFamily ? `'${branding.fontFamily}', sans-serif` : 'inherit',
      ...style,
    };

    return (
      <input
        ref={ref}
        style={customStyle}
        className={`w-full px-3.5 py-2 text-xs md:text-sm bg-white border ${radiusClass} shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
          error ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 hover:border-slate-400'
        } ${className}`}
        {...props}
      />
    );
  }
);
TextInput.displayName = 'TextInput';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ options, placeholder = 'Seleccionar...', className = '', error, style, ...props }, ref) => {
    const { branding } = useApp();
    const radiusClass = branding?.buttonRadius || 'rounded-xl';
    const customStyle: React.CSSProperties = {
      fontFamily: branding?.fontFamily ? `'${branding.fontFamily}', sans-serif` : 'inherit',
      ...style,
    };

    return (
      <select
        ref={ref}
        style={customStyle}
        className={`w-full px-3.5 py-2 text-xs md:text-sm bg-white border ${radiusClass} shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
          error ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 hover:border-slate-400'
        } ${className}`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
SelectInput.displayName = 'SelectInput';

/**
 * Standardized Select dropdown with INLINE ADD feature.
 * Protected by user permissions (canInlineCreate).
 */
export interface SelectWithInlineAddProps extends SelectInputProps {
  onInlineAdd?: (newValue: string) => void;
  inlineAddTitle?: string;
  inlineAddPlaceholder?: string;
  requiredPermission?: keyof UserPermissions;
}

export const SelectWithInlineAdd: React.FC<SelectWithInlineAddProps> = ({
  options,
  value,
  onChange,
  onInlineAdd,
  inlineAddTitle = 'Agregar nuevo elemento',
  inlineAddPlaceholder = 'Ej. Nuevo Rubro / Depósito',
  requiredPermission = 'canInlineCreate',
  placeholder,
  className = '',
  ...props
}) => {
  const { hasPermission } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newInputValue, setNewInputValue] = useState('');

  const canInline = hasPermission(requiredPermission);

  const handleSaveInline = () => {
    if (!newInputValue.trim()) return;
    if (onInlineAdd) {
      onInlineAdd(newInputValue.trim());
    }
    setNewInputValue('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-2">
      {!isAdding ? (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SelectInput
              options={options}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className={className}
              {...props}
            />
          </div>
          {canInline && onInlineAdd && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              title={inlineAddTitle}
              className="p-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow transition flex items-center justify-center shrink-0"
            >
              <Plus className="w-4 h-4 font-bold" />
            </button>
          )}
        </div>
      ) : (
        <div className="p-2.5 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span>+ {inlineAddTitle}</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-amber-700 hover:text-amber-950 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              type="text"
              value={newInputValue}
              onChange={(e) => setNewInputValue(e.target.value)}
              placeholder={inlineAddPlaceholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveInline();
                }
              }}
              className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleSaveInline}
              className="shrink-0 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-lg shadow flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
