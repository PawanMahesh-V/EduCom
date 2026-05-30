import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

const CustomSelect = ({ options, value, onChange, placeholder = "Select an option", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value) || null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`cs-dropdown-container ${className}`} ref={dropdownRef}>
      <div 
        className={`cs-dropdown-trigger ${isOpen ? 'cs-dropdown-trigger--open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="cs-dropdown-selected-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FontAwesomeIcon icon={faChevronDown} className={`cs-dropdown-arrow ${isOpen ? 'cs-dropdown-arrow--up' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="cs-dropdown-options-pane fade-in">
          {options.map((option) => (
            <div 
              key={option.value} 
              className={`cs-dropdown-option-item ${value === option.value ? 'cs-dropdown-option-item--selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;