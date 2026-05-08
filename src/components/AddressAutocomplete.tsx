'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPinIcon, BuildingOfficeIcon, MagnifyingGlassIcon, InboxIcon, TruckIcon } from '@heroicons/react/24/solid';
import { searchSettlements, getWarehouses } from '@/lib/nova-poshta';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: any) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  type: 'city' | 'address';
  cityRef?: string; // Потрібно для пошуку відділень у конкретному місті
  error?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className = '',
  name,
  type,
  cityRef,
  error = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (type === 'address' && cityRef) {
      loadWarehouses('');
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }, 200);
  };

  const loadWarehouses = async (query: string) => {
    if (!cityRef) return;
    setIsLoading(true);
    try {
      const data = await getWarehouses(cityRef, query);
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const search = async (query: string) => {
    if (query.length < 2 && type === 'city') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      if (type === 'city') {
        const data = await searchSettlements(query);
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } else if (type === 'address' && cityRef) {
        const data = await getWarehouses(cityRef, query);
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value && (type === 'city' || (type === 'address' && cityRef))) {
        search(value);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [value, type, cityRef]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelectSuggestion(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    const isSettlement = type === 'city';
    const displayValue = isSettlement 
      ? (suggestion.MainDescription || suggestion.Description) 
      : suggestion.Description;
    
    onChange(displayValue);
    setShowSuggestions(false);
    setActiveIndex(-1);
    
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full px-4 py-4 pl-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 transition-all ${
            error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-purple-300'
          } ${className}`}
          placeholder={placeholder}
          autoComplete="off"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {type === 'city' ? <BuildingOfficeIcon className="w-5 h-5" /> : <MapPinIcon className="w-5 h-5" />}
        </div>
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          {!isLoading && suggestions.length === 0 && (
            <div className="px-4 py-8 text-sm text-gray-500 text-center">
              <MagnifyingGlassIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="font-medium">Нічого не знайдено</p>
              <p className="text-xs text-gray-400 mt-1">Спробуйте змінити запит</p>
            </div>
          )}

          {suggestions.map((suggestion, index) => {
            const isActive = index === activeIndex;
            const isSettlement = type === 'city';
            const isPostomat = !isSettlement && (suggestion.CategoryOfWarehouse === 'Postomat' || suggestion.Description.includes('Поштомат'));
            
            return (
              <button
                key={suggestion.Ref || suggestion.DeliveryCity || index}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(suggestion);
                }}
                className={`w-full px-4 py-4 text-left border-b border-gray-50 last:border-b-0 transition-all ${
                  isActive ? 'bg-purple-50 text-purple-900' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-purple-200 text-purple-700' : 
                    isPostomat ? 'bg-blue-100 text-blue-600' : 
                    isSettlement ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'
                  }`}>
                    {isSettlement ? (
                      <BuildingOfficeIcon className="w-5 h-5" />
                    ) : isPostomat ? (
                      <InboxIcon className="w-5 h-5" />
                    ) : (
                      <TruckIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">
                      {isSettlement ? suggestion.Present : suggestion.Description}
                    </div>
                    {!isSettlement && (
                      <div className="text-xs text-gray-500 truncate flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          isPostomat ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {isPostomat ? 'Поштомат' : 'Відділення'}
                        </span>
                        {suggestion.Number && <span className="font-mono text-gray-400">№{suggestion.Number}</span>}
                      </div>
                    )}
                    {isSettlement && suggestion.Region && (
                      <div className="text-xs text-gray-400 truncate mt-0.5">
                        {suggestion.Region} область
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}