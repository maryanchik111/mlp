'use client';

import { useState, useEffect, useRef } from 'react';

interface AddressSuggestion {
  display_name: string;
  name: string;
  type: string;
  place_id: string | number;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    postcode?: string;
    road?: string;
    house_number?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  type: 'address' | 'city';
  error?: boolean;
}

// Популярні українські міста як fallback
const POPULAR_CITIES = [
  'Київ', 'Харків', 'Одеса', 'Дніпро', 'Львів', 'Запоріжжя', 'Кривий Ріг',
  'Миколаїв', 'Маріуполь', 'Вінниця', 'Макіївка', 'Сєвєродонецьк', 'Херсон',
  'Полтава', 'Чернігів', 'Черкаси', 'Житомир', 'Суми', 'Хмельницький', 'Чернівці',
  'Горлівка', 'Рівне', 'Кролевець', 'Кременчук', 'Тернопіль', 'Івано-Франківск',
  'Білоцерківка', 'Краматорск', 'Мелітополь', 'Керч', 'Нікополь', 'Бердянск',
  'Павлоград', 'Сіверодонецьк', 'Слов\'янськ', 'Дрогобич', 'Алчевськ', 'Лисичанськ',
  'Євпаторія', 'Каховка', 'Мукачево', 'Александрія', 'Красноград', 'Покровськ'
];

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className = '',
  name,
  type,
  error = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Фокус і blur для управління відображенням списку
  const handleFocus = () => {
    if (type === 'city' && value.length === 0) {
      showPopularCities();
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Затримка для обробки кліків на елементи списку
    setTimeout(() => {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }, 200);
  };

  // Показати популярні міста
  const showPopularCities = () => {
    const citySuggestions: AddressSuggestion[] = POPULAR_CITIES.map((city, index) => ({
      display_name: `${city}, Україна`,
      name: city,
      type: 'city',
      place_id: `popular-city-${index}`,
      lat: '0',
      lon: '0',
      address: { city }
    }));
    
    setSuggestions(citySuggestions);
    setShowSuggestions(true);
  };

  // Пошук адрес
  const searchAddresses = async (query: string) => {
    if (query.length < 2) {
      if (type === 'city') {
        showPopularCities();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      return;
    }

    // Фільтрація популярних міст при введенні тексту
    if (type === 'city') {
      const filteredCities = POPULAR_CITIES
        .filter(city => city.toLowerCase().includes(query.toLowerCase()))
        .map((city, index) => ({
          display_name: `${city}, Україна`,
          name: city,
          type: 'city',
          place_id: `filtered-city-${index}`,
          lat: '0',
          lon: '0',
          address: { city }
        }));

      if (filteredCities.length > 0) {
        setSuggestions(filteredCities);
        setShowSuggestions(true);
      }
    }

    setIsLoading(true);
    
    try {
      let searchQuery = query;
      let addressType = '';

      if (type === 'city') {
        addressType = '&addressdetails=1&limit=8&featuretype=city,town,village';
        searchQuery = `${query}, Ukraine`;
      } else {
        addressType = '&addressdetails=1&limit=6&featuretype=street,house';
        searchQuery = `${query}, Ukraine`;
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}${addressType}&countrycodes=ua&accept-language=uk,ru,en`,
        {
          headers: {
            'User-Agent': 'MyLittlePony-Shop/1.0 (https://mlp-shop.ua)'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        let filteredSuggestions = data
          .filter((item: AddressSuggestion) => {
            if (type === 'city') {
              return item.type === 'city' || item.type === 'town' || item.type === 'village' || 
                     item.display_name.includes('місто') || item.display_name.includes('село') ||
                     item.address?.city || item.address?.town || item.address?.village;
            } else {
              return item.address?.road || item.type === 'house' || item.type === 'street';
            }
          })
          .slice(0, type === 'city' ? 5 : 6);

        // Для міст - комбінуємо з популярними містами
        if (type === 'city') {
          const filteredCities = POPULAR_CITIES
            .filter(city => 
              city.toLowerCase().includes(query.toLowerCase()) &&
              !filteredSuggestions.some((s: AddressSuggestion) => 
                (s.address?.city || s.name|| '').toLowerCase() === city.toLowerCase()
              )
            )
            .slice(0, 3)
            .map((city, index) => ({
              display_name: `${city}, Україна`,
              name: city,
              type: 'city',
              place_id: `popular-filtered-city-${index}`,
              lat: '0',
              lon: '0',
              address: { city }
            }));

          filteredSuggestions = [...filteredCities, ...filteredSuggestions];
        }

        setSuggestions(filteredSuggestions);
        setShowSuggestions(filteredSuggestions.length > 0);
      }
    } catch (error) {
      console.error('Помилка пошуку адрес:', error);
      // При помилці API показуємо популярні міста для типу city
      if (type === 'city') {
        const filteredCities = POPULAR_CITIES
          .filter(city => city.toLowerCase().includes(query.toLowerCase()))
          .map((city, index) => ({
            display_name: `${city}, Україна`,
            name: city,
            type: 'city',
            place_id: `fallback-city-${index}`,
            lat: '0',
            lon: '0',
            address: { city }
          }));
        setSuggestions(filteredCities);
        setShowSuggestions(filteredCities.length > 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce для пошуку
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value) {
        searchAddresses(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, type]);

  // Обробка клавіатурної навігації
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
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

  // Обробка вибору пропозиції
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    let displayValue = '';
    
    if (type === 'city') {
      displayValue = suggestion.address?.city || 
                    suggestion.address?.town || 
                    suggestion.address?.village || 
                    suggestion.name;
    } else {
      if (suggestion.address?.road) {
        displayValue = suggestion.address.road;
        if (suggestion.address.house_number) {
          displayValue += `, ${suggestion.address.house_number}`;
        }
      } else {
        displayValue = suggestion.display_name.split(',')[0];
      }
    }

    onChange(displayValue);
    setShowSuggestions(false);
    setActiveIndex(-1);
    
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  // Форматування відображення пропозиції
  const formatSuggestion = (suggestion: AddressSuggestion) => {
    if (type === 'city') {
      const city = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.name;
      const parts = suggestion.display_name.split(',');
      const region = parts.find(part => part.includes('область') || part.includes('край'));
      return {
        main: city,
        secondary: region ? region.trim() : parts[1]?.trim()
      };
    } else {
      const parts = suggestion.display_name.split(',');
      const main = parts[0];
      const secondary = parts.slice(1, 3).join(',').trim();
      return {
        main,
        secondary
      };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
        } ${className}`}
        placeholder={placeholder}
        autoComplete="off"
      />

      {/* Dropdown з пропозиціями */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Пошук адрес...</span>
              </div>
            </div>
          )}
          
          {/* Популярні міста заголовок */}
          {!isLoading && type === 'city' && value.length === 0 && suggestions.length > 0 && (
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-50 border-b">
              🏙️ Популярні міста
            </div>
          )}
          
          {!isLoading && suggestions.length === 0 && value.length >= 2 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              <div className="text-2xl mb-2">🔍</div>
              {type === 'city' ? 'Місто не знайдено' : 'Адресу не знайдено'}
              <div className="text-xs mt-1 text-gray-400">
                Спробуйте інший варіант написання
              </div>
            </div>
          )}

          {!isLoading && suggestions.map((suggestion, index) => {
            const formatted = formatSuggestion(suggestion);
            const isActive = index === activeIndex;
            const isPopular = typeof suggestion.place_id === 'string' && 
              (suggestion.place_id.includes('popular-city') || 
               suggestion.place_id.includes('filtered-city') || 
               suggestion.place_id.includes('fallback-city'));
            
            return (
              <button
                key={`${String(suggestion.place_id || 'item')}-${index}`}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                  isActive ? 'bg-indigo-50 border-indigo-200' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg flex-shrink-0">
                    {type === 'city' ? (isPopular ? '⭐' : '🏙️') : '🏠'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {formatted.main}
                    </div>
                    {formatted.secondary && (
                      <div className="text-sm text-gray-500 truncate">
                        {formatted.secondary}
                      </div>
                    )}
                    {isPopular && type === 'city' && (
                      <div className="text-xs text-purple-600 mt-1">
                        Популярний вибір
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <div className="text-indigo-600 text-sm">
                      ⏎
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          
          {/* Підказки щодо використання */}
          {!isLoading && suggestions.length > 0 && (
            <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t">
              💡 Використовуйте ↑↓ для навігації, Enter для вибору
            </div>
          )}
        </div>
      )}
    </div>
  );
}