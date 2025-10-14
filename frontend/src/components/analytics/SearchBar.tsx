// frontend/src/components/analytics/SearchBar.tsx
'use client';

// On ajoute 'useEffect' à la liste des imports depuis React
import React, { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';

const SearchBar = ({ onSearch, onSelect, onClear }: any) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const getSuggestions = async () => {
      if (debouncedQuery) {
        const results = await onSearch(debouncedQuery);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    };
    getSuggestions();
  }, [debouncedQuery, onSearch]);
  
  const handleSelect = (item: any) => {
    setQuery(item.name);
    setSuggestions([]);
    onSelect(item);
  };
  
  const handleClear = () => {
      setQuery('');
      setSuggestions([]);
      onClear();
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher une radio ou un groupe..."
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md"
      />
      {query && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer" onClick={handleClear} />}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((item: any) => (
            <li
              key={item.id || item.name}
              onClick={() => handleSelect(item)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {item.name} <span className="text-xs text-gray-500 capitalize">({item.type})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;