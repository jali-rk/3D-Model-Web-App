import React from 'react';

interface GarmentSizeSelectorProps {
  garmentId: string;
  selectedSize: string;
  onSizeChange: (garmentId: string, size: string) => void;
  disabled?: boolean;
}

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const GarmentSizeSelector: React.FC<GarmentSizeSelectorProps> = ({ 
  garmentId, 
  selectedSize, 
  onSizeChange,
  disabled = false 
}) => {
  return (
    <select
      value={selectedSize}
      onChange={(e) => onSizeChange(garmentId, e.target.value)}
      disabled={disabled}
      style={{
        padding: '4px 8px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '12px',
        marginLeft: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1
      }}
      onClick={(e) => e.stopPropagation()} // Prevent triggering parent button click
    >
      {sizes.map((size) => (
        <option key={size} value={size}>
          Size {size}
        </option>
      ))}
    </select>
  );
};

export default GarmentSizeSelector;