'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/solid';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  error?: boolean;
  onValidation?: (isValid: boolean) => void;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = "067 123-45-67",
  className = '',
  name,
  error = false,
  onValidation
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Очищення номеру: залишаємо тільки цифри
  const cleanNumber = (input: string): string => {
    return input.replace(/\D/g, '');
  };

  // Форматування номеру для відображення
  const formatDisplay = (cleaned: string): string => {
    if (cleaned.length === 0) return '';
    
    // Якщо номер починається з 38, видаляємо це для форматування
    if (cleaned.startsWith('38') && cleaned.length > 2) {
      cleaned = cleaned.substring(2);
    }
    
    // Українські номери починаються з 0
    if (cleaned.length > 0 && !cleaned.startsWith('0')) {
      cleaned = '0' + cleaned;
    }

    // Форматуємо поступово
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
    } else if (cleaned.length <= 8) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    } else {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 10)}`;
    }
  };

  // Отримання назви оператора
  const getOperatorName = (cleaned: string): string => {
    if (cleaned.length < 3) return '';
    
    const code = cleaned.substring(0, 3);
    const operators: { [key: string]: string } = {
      '050': 'Vodafone', '066': 'Vodafone', '095': 'Vodafone', '099': 'Vodafone',
      '067': 'Kyivstar', '068': 'Kyivstar', '096': 'Kyivstar', '097': 'Kyivstar', '098': 'Kyivstar',
      '063': 'lifecell', '073': 'lifecell', '093': 'lifecell',
      '091': 'Trimob', '092': 'PeopleNet', '094': 'Інтертелеком',
      '089': 'Інтертелеком', '077': '3 Мобайл'
    };
    
    return operators[code] || '';
  };

  // Валідація українського номеру
  const validatePhone = (cleaned: string): boolean => {
    // Українські номери мають 10 цифр і починаються з 0
    if (cleaned.length !== 10) return false;
    if (!cleaned.startsWith('0')) return false;
    
    // Перевіряємо коди операторів України
    const validCodes = [
      // Vodafone Ukraine (MTS)
      '050', '066', '095', '099',
      // Kyivstar
      '067', '068', '096', '097', '098',
      // lifecell
      '063', '073', '093',
      // Інші оператори
      '091', '092', '094', // Trimob, PeopleNet
      '089', // Інтертелеком
      '077', // ТОВ "3 Мобайл", ІТ телеком
    ];
    
    const operatorCode = cleaned.substring(0, 3);
    return validCodes.includes(operatorCode);
  };

  // Обробка введення
  const handleInput = (inputValue: string) => {
    const cleaned = cleanNumber(inputValue);
    const formatted = formatDisplay(cleaned);
    const valid = validatePhone(cleaned);
    
    setDisplayValue(formatted);
    setIsValid(valid);
    
    // Передаємо повний номер з кодом країни
    const fullNumber = cleaned.length > 0 ? `+38${cleaned}` : '';
    onChange(fullNumber);
    
    if (onValidation) {
      onValidation(valid);
    }
  };

  // Обробка клавіш
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Дозволяємо тільки цифри, backspace, delete, Tab, стрілки
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];
    
    if (allowedKeys.includes(e.key)) return;
    
    if (e.key >= '0' && e.key <= '9') return;
    
    // Блокуємо всі інші клавіші
    e.preventDefault();
  };

  // Ініціалізація з existуючого значення
  useEffect(() => {
    if (value) {
      const cleaned = cleanNumber(value);
      const formatted = formatDisplay(cleaned);
      setDisplayValue(formatted);
      setIsValid(validatePhone(cleaned));
    } else {
      setDisplayValue('');
      setIsValid(false);
    }
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        name={name}
        value={displayValue}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 ${
          error 
            ? 'border-red-500 bg-red-50' 
            : isValid 
            ? 'border-green-500 bg-green-50' 
            : displayValue 
            ? 'border-yellow-500 bg-yellow-50' 
            : 'border-gray-300 bg-white'
        } ${className}`}
        placeholder={placeholder}
        autoComplete="tel"
      />
      
      {/* Іконка стану */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        {displayValue && (
          <div className="text-lg">
            {isValid ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            )}
          </div>
        )}
      </div>
      
      {/* Підказки */}
      <div className="mt-1 text-xs">
        {displayValue && !isValid && (
          <p className="text-yellow-600 flex items-center gap-1">
            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
            {cleanNumber(displayValue).length < 10 
              ? `Введіть ще ${10 - cleanNumber(displayValue).length} цифр`
              : 'Невірний код оператора'
            }
          </p>
        )}
        {isValid && (
          <p className="text-green-600 flex items-center gap-1">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            {getOperatorName(cleanNumber(displayValue)) 
              ? `${getOperatorName(cleanNumber(displayValue))} • +38${cleanNumber(displayValue)}`
              : `Номер коректний • +38${cleanNumber(displayValue)}`
            }
          </p>
        )}
        {!displayValue && (
          <div className="text-gray-500">
            <p className="flex items-center gap-1 mb-1">
              <DevicePhoneMobileIcon className="w-4 h-4" />
              Формат: XXX XXX-XX-XX
            </p>
            <p className="text-xs">
              🔹 Київстар: 067, 068, 096, 097, 098<br/>
              🔹 Vodafone: 050, 066, 095, 099<br/>  
              🔹 lifecell: 063, 073, 093
            </p>
          </div>
        )}
      </div>
    </div>
  );
}