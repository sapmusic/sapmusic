import React, { useState, useRef, useEffect } from 'react';
import { Writer } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { WRITER_ROLES, PRO_SOCIETIES } from '../constants';
import { UserSearchIcon } from './icons/UserSearchIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';

interface WriterErrors {
    name?: string;
    role?: string;
    dob?: string;
    society?: string;
    ipi?: string;
}

const InputError: React.FC<{ message?: string; }> = ({ message }) => {
    if (!message) return null;
    return (
        <p className={`flex items-center gap-1 text-xs mt-1 text-red-400`}>
            <ExclamationCircleIcon className="h-4 w-4" />
            {message}
        </p>
    );
};

interface WriterSplitInputProps {
  writer: Writer;
  onChange: (writer: Writer) => void;
  onRemove: (writerId: string) => void;
  onFindWriter: (writerId: string) => void;
  onBlur: (writerId: string, field: keyof WriterErrors) => void;
  isEditable?: boolean;
  errors?: WriterErrors;
  touched?: Partial<Record<keyof WriterErrors, boolean>>;
}

const WriterSplitInput: React.FC<WriterSplitInputProps> = ({ 
    writer, 
    onChange, 
    onRemove, 
    onFindWriter,
    onBlur,
    isEditable = false,
    errors,
    touched,
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [roleDropdownRef]);


  const handleSplitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange({ ...writer, split: isNaN(value) ? 0 : Math.max(0, Math.min(100, value)) });
  };
  
  const handleAgreementToggle = () => {
      onChange({ ...writer, agreed: !writer.agreed });
  };

  const handleRoleToggle = (roleToToggle: string) => {
    const newRoles = writer.role.includes(roleToToggle)
      ? writer.role.filter(r => r !== roleToToggle)
      : [...writer.role, roleToToggle];
    onChange({ ...writer, role: newRoles });
  };

  const getFieldStatusClasses = (isTouched: boolean, error?: string) => {
    if (!isEditable) return 'border-slate-600';
    if (!isTouched) return 'border-slate-600';
    return error ? 'border-red-500' : 'border-green-500';
  };

  const inputBaseClasses = "w-full border rounded-md px-3 py-1.5 focus:ring-2 focus:ring-amber-400 focus:outline-none";
  const editableClasses = "bg-slate-700";
  const readOnlyClasses = "bg-slate-600/50 text-slate-300";
  
  return (
    <div className="bg-slate-700/50 p-3 rounded-md">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_90px_140px_auto] gap-3 items-start">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Writer Name *</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={writer.name}
              readOnly={!isEditable}
              onChange={(e) => onChange({ ...writer, name: e.target.value })}
              onBlur={() => onBlur(writer.id, 'name')}
              placeholder="e.g. John Doe"
              className={`${inputBaseClasses} ${isEditable ? editableClasses : readOnlyClasses} ${getFieldStatusClasses(!!touched?.name, errors?.name)}`}
            />
            {isEditable && (
                <button 
                  onClick={() => onFindWriter(writer.id)}
                  className="h-[38px] w-[38px] flex-shrink-0 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors" 
                  aria-label="Find writer from library"
                  title="Find writer from library"
                >
                    <UserSearchIcon className="h-5 w-5" />
                </button>
            )}
          </div>
           <InputError message={touched?.name ? errors?.name : ''} />
        </div>
        <div ref={roleDropdownRef}>
          <label className="text-xs text-slate-400 block mb-1">Role(s) *</label>
            <div className="relative">
                <button 
                onClick={() => isEditable && setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                onBlur={() => onBlur(writer.id, 'role')}
                className={`${inputBaseClasses} ${isEditable ? editableClasses : readOnlyClasses} ${getFieldStatusClasses(!!touched?.role, errors?.role)} text-left w-full flex justify-between items-center h-[38px]`}
                disabled={!isEditable}
                >
                <span className={`truncate ${writer.role.length > 0 ? 'text-white' : 'text-slate-400'}`}>
                    {writer.role.length > 0 ? writer.role.join(', ') : 'Select role(s)...'}
                </span>
                {isEditable && <ChevronDownIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />}
                </button>
                {isRoleDropdownOpen && isEditable && (
                <div className="absolute z-10 top-full mt-1 w-full bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {WRITER_ROLES.map(role => (
                    <label key={role} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-600 cursor-pointer">
                        <input 
                        type="checkbox"
                        checked={writer.role.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="h-4 w-4 bg-slate-800 border-slate-600 text-amber-500 focus:ring-amber-400 rounded"
                        />
                        <span>{role}</span>
                    </label>
                    ))}
                </div>
                )}
            </div>
            <InputError message={touched?.role ? errors?.role : ''} />
        </div>
        <div className="pt-5">
          <label className="text-xs text-slate-400 block mb-1 sr-only">Split %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={writer.split}
            onChange={handleSplitChange}
            className={`${inputBaseClasses} ${editableClasses} border-slate-600`}
          />
        </div>
        <div className="pt-5 self-start">
           <button
              onClick={handleAgreementToggle}
              className={`w-full flex items-center justify-center gap-2 h-[38px] rounded-md font-semibold text-sm transition-colors ${
                  writer.agreed
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
          >
              {writer.agreed && <CheckCircleIcon className="h-5 w-5" />}
              {writer.agreed ? 'Agreed' : 'Click to Agree'}
          </button>
        </div>
        <div className="pt-5 self-start">
          {isEditable && (
              <button onClick={() => onRemove(writer.id)} className="h-[38px] w-[38px] flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" aria-label="Remove writer">
                  <TrashIcon className="h-5 w-5" />
              </button>
          )}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-600/50 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
                <label className="text-xs text-slate-400 block mb-1">Date of Birth *</label>
                <input
                    type="date"
                    value={writer.dob || ''}
                    disabled={!isEditable}
                    onChange={(e) => onChange({ ...writer, dob: e.target.value })}
                    onBlur={() => onBlur(writer.id, 'dob')}
                    className={`${inputBaseClasses} ${isEditable ? editableClasses : readOnlyClasses} ${getFieldStatusClasses(!!touched?.dob, errors?.dob)}`}
                />
                 <InputError message={touched?.dob ? errors?.dob : ''} />
            </div>
            <div>
                <label className="text-xs text-slate-400 block mb-1">Society (PRO) *</label>
                <select
                    value={writer.society || ''}
                    disabled={!isEditable}
                    onChange={(e) => onChange({ ...writer, society: e.target.value })}
                    onBlur={() => onBlur(writer.id, 'society')}
                    className={`${inputBaseClasses} ${isEditable ? editableClasses : readOnlyClasses} ${getFieldStatusClasses(!!touched?.society, errors?.society)}`}
                >
                    <option value="">Select Society</option>
                    {PRO_SOCIETIES.map(soc => <option key={soc} value={soc}>{soc}</option>)}
                </select>
                <InputError message={touched?.society ? errors?.society : ''} />
            </div>
             <div>
                <label className="text-xs text-slate-400 block mb-1">IPI Number *</label>
                <input
                    type="text"
                    placeholder="e.g. 123456789"
                    value={writer.ipi || ''}
                    disabled={!isEditable}
                    onChange={(e) => onChange({ ...writer, ipi: e.target.value })}
                    onBlur={() => onBlur(writer.id, 'ipi')}
                    className={`${inputBaseClasses} ${isEditable ? editableClasses : readOnlyClasses} ${getFieldStatusClasses(!!touched?.ipi, errors?.ipi)}`}
                />
                <InputError message={touched?.ipi ? errors?.ipi : ''} />
            </div>
        </div>
        
        <div className="flex justify-between items-center pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                  <input
                      type="checkbox"
                      checked={writer.collectOnBehalf}
                      onChange={(e) => onChange({ ...writer, collectOnBehalf: e.target.checked })}
                      className="h-4 w-4 bg-slate-800 border-slate-600 text-amber-500 focus:ring-amber-400 rounded"
                  />
                  Collect royalties on this writer's behalf
            </label>

        </div>
      </div>
    </div>
  );
};

export default WriterSplitInput;
