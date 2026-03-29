"use client";

import { useState, useEffect, useRef } from "react";

interface MultiSelectDropdownProps {
  label?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  selectAllText?: string;
  clearText?: string;
  noDataText?: string;
}

export default function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  selectAllText = "Select All",
  clearText = "Clear",
  noDataText = "No options available.",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="block text-sm font-extrabold text-gray-800 mb-2">
          {label}
        </label>
      )}

      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl flex justify-between items-center text-gray-900 font-bold focus:border-blue-600 focus:bg-white transition-all"
      >
        <span className="truncate">
          {selected.length === 0 ? placeholder : `${selected.length} Selected`}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar inside dropdown */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-blue-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-white">
            <button
              type="button"
              onClick={() => onChange(options)}
              className="text-[10px] font-black text-blue-600 uppercase tracking-wider active:scale-95 transition-transform"
            >
              {selectAllText}
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[10px] font-black text-red-500 uppercase tracking-wider active:scale-95 transition-transform"
            >
              {clearText}
            </button>
          </div>

          {/* Scrollable List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm font-bold text-gray-400">
                {noDataText}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-3 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-gray-800 line-clamp-1">
                    {option}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Display Selected Pills (Preview) */}
      {selected.length > 0 && !isOpen && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.slice(0, 5).map((item) => (
            <span
              key={item}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100"
            >
              {item}
            </span>
          ))}
          {selected.length > 5 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg border border-gray-200">
              +{selected.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
