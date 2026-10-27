import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown, Plus, Check, CornerDownLeft } from 'lucide-react';

export const CitySearchInput = ({
  label,
  value = '',
  onChange,
  onSelectNext,
  cities = [],
  placeholder = 'Search or enter city name...',
  required = false,
  autoFocus = false,
  helperText,
  disabled = false,
  id,
  name,
  tabIndex,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync internal query with external value prop
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Outside click closes dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedQuery = (query || '').trim().toLowerCase();

  // Filter cities by name or any location/stop
  const filteredCities = cities.filter((c) => {
    if (!trimmedQuery) return true;
    const nameMatch = c.name && c.name.toLowerCase().includes(trimmedQuery);
    const locMatch = Array.isArray(c.locations) && c.locations.some((l) => (l || '').toLowerCase().includes(trimmedQuery));
    const addrMatch = c.deliveryAddress && c.deliveryAddress.toLowerCase().includes(trimmedQuery);
    return nameMatch || locMatch || addrMatch;
  });

  const exactMatch = cities.some((c) => (c.name || '').trim().toLowerCase() === trimmedQuery);
  const showCustomOption = query.trim() && !exactMatch;
  const totalOptions = filteredCities.length + (showCustomOption ? 1 : 0);

  // Auto-highlight first matching option whenever query changes
  const handleInputChange = (e) => {
    const nextVal = e.target.value;
    setQuery(nextVal);
    setIsOpen(true);
    setActiveIndex(0);
    if (onChange) {
      const matched = cities.find((c) => (c.name || '').trim().toLowerCase() === nextVal.trim().toLowerCase());
      onChange(nextVal, matched || { name: nextVal, deliveryAddress: '', locations: [] });
    }
  };

  // Scroll active item into view during arrow key navigation
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex];
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  const handleSelectCity = (city) => {
    setQuery(city.name);
    setIsOpen(false);
    setActiveIndex(0);
    if (onChange) {
      onChange(city.name, city);
    }
    if (onSelectNext) {
      setTimeout(() => onSelectNext(), 50);
    }
  };

  const handleCustomCity = () => {
    const customName = query.trim();
    if (!customName) return;
    setQuery(customName);
    setIsOpen(false);
    setActiveIndex(0);
    if (onChange) {
      onChange(customName, { name: customName, deliveryAddress: '', locations: [] });
    }
    if (onSelectNext) {
      setTimeout(() => onSelectNext(), 50);
    }
  };

  // Keyboard navigation with Arrow keys, Enter, Tab, and Escape
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
        return;
      }
      if (e.key === 'Enter') {
        if (query.trim() && onSelectNext) {
          e.preventDefault();
          onSelectNext();
        }
        return;
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (totalOptions > 0) {
        setActiveIndex((prev) => (prev + 1 < totalOptions ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (totalOptions > 0) {
        setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalOptions - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (activeIndex >= 0 && activeIndex < filteredCities.length) {
        handleSelectCity(filteredCities[activeIndex]);
      } else if (activeIndex === filteredCities.length && showCustomOption) {
        handleCustomCity();
      } else if (filteredCities.length > 0) {
        handleSelectCity(filteredCities[0]);
      } else if (showCustomOption) {
        handleCustomCity();
      } else {
        setIsOpen(false);
        if (onSelectNext) onSelectNext();
      }
    } else if (e.key === 'Tab') {
      // Tab selection
      if (isOpen && totalOptions > 0) {
        if (activeIndex >= 0 && activeIndex < filteredCities.length) {
          handleSelectCity(filteredCities[activeIndex]);
        } else if (showCustomOption && activeIndex === filteredCities.length) {
          handleCustomCity();
        } else if (filteredCities.length === 1) {
          handleSelectCity(filteredCities[0]);
        }
      }
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="form-group" style={{ position: 'relative', marginBottom: 0 }} ref={containerRef}>
      {label && (
        <label className="form-label" htmlFor={id} style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '10px',
            color: '#94a3b8',
            pointerEvents: 'none',
          }}
        />

        <input
          ref={inputRef}
          id={id}
          name={name || `search_dest_input_${id || 'city'}`}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          className="form-control"
          style={{
            paddingLeft: '32px',
            paddingRight: '28px',
            fontSize: '0.8125rem',
            paddingTop: '0.45rem',
            paddingBottom: '0.45rem',
            fontWeight: 500,
          }}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              setActiveIndex(0);
            }
          }}
          onKeyDown={handleKeyDown}
          required={required}
          autoFocus={autoFocus}
          disabled={disabled}
          tabIndex={tabIndex}
          /* Anti-Autofill / Anti-Google Chrome Address Recommendation attributes */
          autoComplete="new-password"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          data-autocomplete="off"
        />

        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setActiveIndex(0);
          }}
          tabIndex={-1}
          style={{
            position: 'absolute',
            right: '6px',
            border: 'none',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronDown
            size={13}
            style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          />
        </button>
      </div>

      {helperText && (
        <div className="form-hint" style={{ marginTop: '2px', fontSize: '0.6875rem' }}>
          {helperText}
        </div>
      )}

      {/* Floating Suggestions Dropdown with High-Contrast Arrow Key Navigation */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 3px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            boxShadow: '0 8px 24px -2px rgba(0, 0, 0, 0.15), 0 4px 8px -2px rgba(0, 0, 0, 0.08)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div
            ref={listRef}
            style={{
              maxHeight: '210px',
              overflowY: 'auto',
              padding: '3px',
            }}
          >
            {filteredCities.length === 0 && !query.trim() && (
              <div style={{ padding: '8px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                No cities added yet.
              </div>
            )}

            {filteredCities.map((c, idx) => {
              const isSelected = (value || '').trim().toLowerCase() === (c.name || '').trim().toLowerCase();
              const isHighlighted = activeIndex === idx;
              const locList =
                Array.isArray(c.locations) && c.locations.length > 0
                  ? c.locations
                  : c.deliveryAddress
                  ? [c.deliveryAddress]
                  : [];
              const locText = locList.join(' • ');

              return (
                <div
                  key={c._id || c.name || idx}
                  onClick={() => handleSelectCity(c)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: isHighlighted ? '#f1f5f9' : isSelected ? '#e2e8f0' : 'transparent',
                    borderLeft: isHighlighted ? '3px solid #0f172a' : '3px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                    gap: '6px',
                    transition: 'background-color 0.08s ease',
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <MapPin
                      size={13}
                      color={isHighlighted ? '#0f172a' : isSelected ? '#0f172a' : '#64748b'}
                      style={{ flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontWeight: isHighlighted ? 700 : isSelected ? 700 : 600,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.name}
                    </span>
                    {locText && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          opacity: 0.9,
                        }}
                        title={locText}
                      >
                        ({locText})
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {isHighlighted && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <CornerDownLeft size={10} /> Select
                      </span>
                    )}
                    {isSelected && !isHighlighted && <Check size={13} color="#0f172a" />}
                  </div>
                </div>
              );
            })}

            {/* Custom city option at bottom if user typed a name not in list */}
            {showCustomOption && (
              <div
                onClick={handleCustomCity}
                style={{
                  padding: '6px 10px',
                  marginTop: '2px',
                  borderTop: filteredCities.length > 0 ? '1px solid #e2e8f0' : 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  color: '#0f172a',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: activeIndex === filteredCities.length ? '#f1f5f9' : '#f8fafc',
                  borderLeft: activeIndex === filteredCities.length ? '3px solid #0f172a' : '3px solid transparent',
                }}
                onMouseEnter={() => setActiveIndex(filteredCities.length)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={13} color="#0f172a" />
                  <span>
                    Use custom <strong>"{query.trim()}"</strong>
                  </span>
                </div>
                {activeIndex === filteredCities.length && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <CornerDownLeft size={10} /> Use
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bottom Keyboard Navigation Helper Bar */}
          <div
            style={{
              padding: '3px 8px',
              fontSize: '0.6875rem',
              color: '#64748b',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <kbd style={{ backgroundColor: '#e2e8f0', padding: '1px 3px', borderRadius: '2px', fontSize: '0.625rem' }}>↑</kbd>
              <kbd style={{ backgroundColor: '#e2e8f0', padding: '1px 3px', borderRadius: '2px', fontSize: '0.625rem' }}>↓</kbd>
              navigate
            </span>
            <span>
              <kbd style={{ backgroundColor: '#e2e8f0', padding: '1px 3px', borderRadius: '2px', fontSize: '0.625rem' }}>Enter ↵</kbd> select
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
