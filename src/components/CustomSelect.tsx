import React, { useState, useRef, useEffect } from "react";

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  disabled?: boolean;
  title?: string;
  placeholder?: string;
  searchable?: boolean;
};

export default function CustomSelect({
  value,
  onChange,
  options,
  className = "",
  disabled = false,
  title,
  placeholder = "Select...",
  searchable = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label ?? (value && value !== "" ? value : placeholder);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    } else if (searchable && searchInputRef.current) {
      // Focus search input when dropdown opens
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen, searchable]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle keys if typing in search input
      if (searchable && searchInputRef.current === document.activeElement) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
          e.preventDefault();
          if (e.key === "ArrowDown") {
            setHighlightedIndex((prev) => {
              const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
              scrollToOption(next);
              return next;
            });
          } else if (e.key === "ArrowUp") {
            setHighlightedIndex((prev) => {
              const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
              scrollToOption(next);
              return next;
            });
          } else if (e.key === "Enter" && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            onChange(filteredOptions[highlightedIndex].value);
            setIsOpen(false);
            setHighlightedIndex(-1);
            setSearchQuery("");
          }
        }
        return;
      }

      if (e.key === "Escape") {
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchQuery("");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < filteredOptions.length - 1 ? prev + 1 : prev;
          scrollToOption(next);
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : 0;
          scrollToOption(next);
          return next;
        });
      } else if (e.key === "Enter" && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        e.preventDefault();
        onChange(filteredOptions[highlightedIndex].value);
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchQuery("");
      } else if (searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Start typing to search
        setSearchQuery(e.key);
        setHighlightedIndex(0);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions, onChange, searchable]);

  function scrollToOption(index: number) {
    // Find the options container (second child if searchable, first child otherwise)
    const optionsContainer = searchable 
      ? dropdownRef.current?.children[1] as HTMLElement
      : dropdownRef.current?.children[0] as HTMLElement;
    const optionElement = optionsContainer?.children[index] as HTMLElement;
    if (optionElement) {
      optionElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function handleToggle() {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      const currentIndex = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    } else {
      setSearchQuery("");
    }
  }

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setSearchQuery("");
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value;
    setSearchQuery(query);
    setHighlightedIndex(0); // Reset highlight to first filtered option
  }

  function handleOptionMouseEnter(index: number) {
    setHighlightedIndex(index);
  }

  // Calculate dropdown position
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const searchHeight = searchable ? 50 : 0; // Account for search input height
      const dropdownHeight = Math.min(300, filteredOptions.length * 36 + 8 + searchHeight);

      if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
        // Open downward
        setDropdownStyle({
          top: "100%",
          marginTop: "4px",
        });
      } else {
        // Open upward
        setDropdownStyle({
          bottom: "100%",
          marginBottom: "4px",
        });
      }
    }
  }, [isOpen, filteredOptions.length, searchable]);

  return (
    <div
      ref={containerRef}
      className={`custom-select-wrapper ${className} ${isOpen ? "is-open" : ""} ${disabled ? "is-disabled" : ""}`}
      title={title}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="custom-select-value">{displayValue}</span>
        <svg
          className="custom-select-arrow"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="#e5812b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="custom-select-dropdown" ref={dropdownRef} style={dropdownStyle}>
          {searchable && (
            <div className="custom-select-search">
              <input
                ref={searchInputRef}
                type="text"
                className="custom-select-search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="custom-select-options">
            {filteredOptions.length === 0 ? (
              <div className="custom-select-no-results">No results found</div>
            ) : (
              filteredOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                className={`custom-select-option ${
                  option.value === value ? "is-selected" : ""
                } ${index === highlightedIndex ? "is-highlighted" : ""}`}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => handleOptionMouseEnter(index)}
              >
                {option.label}
                {option.value === value && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="check-icon"
                  >
                    <path
                      d="M11.6667 3.5L5.25 9.91667L2.33334 7"
                      stroke="#e5812b"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .custom-select-wrapper {
          position: relative;
          display: inline-block;
          min-width: 140px;
        }

        .custom-select-trigger {
          appearance: none;
          width: 100%;
          background: linear-gradient(180deg, rgba(22,27,34,0.95), rgba(18,23,30,0.95));
          color: var(--text, #e6edf7);
          border: 1px solid var(--border-strong, rgba(255,255,255,0.12));
          border-radius: 10px;
          padding: 7px 32px 7px 12px;
          font-size: 13px;
          font-weight: 500;
          font-family: Inter, ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          outline: none;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 
            inset 0 1px 2px rgba(0,0,0,0.3),
            inset 0 0 0 1px rgba(255,255,255,0.04),
            0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .custom-select-trigger:hover:not(:disabled) {
          border-color: rgba(229,129,43,0.4);
          background: linear-gradient(180deg, rgba(26,32,40,0.98), rgba(22,27,34,0.98));
          box-shadow: 
            inset 0 1px 2px rgba(0,0,0,0.3),
            inset 0 0 0 1px rgba(229,129,43,0.15),
            0 4px 12px rgba(0,0,0,0.3),
            0 0 0 1px rgba(229,129,43,0.1);
          transform: translateY(-1px);
        }

        .custom-select-trigger:focus:not(:disabled),
        .custom-select-wrapper.is-open .custom-select-trigger {
          border-color: var(--accent, #e5812b);
          background: linear-gradient(180deg, rgba(28,34,42,1), rgba(24,29,36,1));
          box-shadow: 
            inset 0 1px 2px rgba(0,0,0,0.3),
            inset 0 0 0 1px rgba(229,129,43,0.25),
            0 6px 20px rgba(229,129,43,0.25),
            0 0 0 3px rgba(229,129,43,0.15);
          transform: translateY(-1px);
        }

        .custom-select-trigger:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 
            inset 0 2px 4px rgba(0,0,0,0.4),
            inset 0 0 0 1px rgba(229,129,43,0.2),
            0 2px 8px rgba(0,0,0,0.3);
        }

        .custom-select-trigger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .custom-select-value {
          flex: 1;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .custom-select-arrow {
          flex-shrink: 0;
          margin-left: 8px;
          transition: transform 0.2s ease;
        }

        .custom-select-wrapper.is-open .custom-select-arrow {
          transform: rotate(180deg);
        }

        .custom-select-dropdown {
          position: absolute;
          left: 0;
          right: 0;
          z-index: 1000;
          animation: dropdownFadeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .custom-select-search {
          padding: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(22,27,34,0.98);
        }

        .custom-select-search-input {
          width: 100%;
          background: rgba(18,23,30,0.8);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          padding: 6px 10px;
          color: var(--text, #e6edf7);
          font-size: 13px;
          font-family: Inter, ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          outline: none;
          transition: border-color 0.2s;
        }

        .custom-select-search-input:focus {
          border-color: rgba(229,129,43,0.4);
          background: rgba(22,27,34,0.95);
        }

        .custom-select-no-results {
          padding: 12px;
          text-align: center;
          color: rgba(255,255,255,0.5);
          font-size: 13px;
          font-style: italic;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .custom-select-options {
          background: linear-gradient(180deg, rgba(22,27,34,0.98), rgba(18,23,30,0.98));
          backdrop-filter: blur(20px) saturate(1.2);
          border: 1px solid rgba(229,129,43,0.3);
          border-radius: 10px;
          box-shadow: 
            0 8px 32px rgba(0,0,0,0.5),
            0 4px 16px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.08);
          overflow: hidden;
          max-height: 300px;
          overflow-y: auto;
          padding: 4px;
        }

        .custom-select-options::-webkit-scrollbar {
          width: 8px;
        }

        .custom-select-options::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
        }

        .custom-select-options::-webkit-scrollbar-thumb {
          background: rgba(229,129,43,0.3);
          border-radius: 4px;
        }

        .custom-select-options::-webkit-scrollbar-thumb:hover {
          background: rgba(229,129,43,0.5);
        }

        .custom-select-option {
          width: 100%;
          padding: 9px 12px;
          text-align: left;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--text, #e6edf7);
          font-size: 13px;
          font-weight: 500;
          font-family: Inter, ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          cursor: pointer;
          transition: all 0.12s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .custom-select-option:hover,
        .custom-select-option.is-highlighted {
          background: linear-gradient(90deg, rgba(229,129,43,0.15), rgba(229,129,43,0.08));
          color: var(--text, #e6edf7);
        }

        .custom-select-option.is-selected {
          background: linear-gradient(90deg, rgba(229,129,43,0.25), rgba(229,129,43,0.15));
          color: var(--text, #e6edf7);
          font-weight: 600;
        }

        .custom-select-option.is-selected:hover,
        .custom-select-option.is-selected.is-highlighted {
          background: linear-gradient(90deg, rgba(229,129,43,0.3), rgba(229,129,43,0.2));
        }

        .check-icon {
          flex-shrink: 0;
          opacity: 0.9;
        }

        @media (max-width: 900px), (max-height: 700px) {
          .custom-select-trigger {
            height: 34px;
            font-size: 12px;
            padding: 6px 28px 6px 10px;
          }
          .custom-select-wrapper {
            min-width: 120px;
          }
          .custom-select-option {
            padding: 8px 10px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}

