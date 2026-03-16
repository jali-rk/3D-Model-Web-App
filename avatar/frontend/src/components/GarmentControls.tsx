import React, { useState } from 'react';
import type { Garment, GarmentItem } from '../types';
import GarmentSizeSelector from './GarmentSizeSelector';

interface GarmentControlsProps {
  garments: Garment[];
  selectedGarments: GarmentItem[]; // Changed from string[] to GarmentItem[]
  setSelectedGarments: (garments: GarmentItem[]) => void;
  disabled?: boolean;
}

const GarmentControls: React.FC<GarmentControlsProps> = ({ 
  garments, 
  selectedGarments, 
  setSelectedGarments,
  disabled 
}) => {
  const [hoveredGarment, setHoveredGarment] = useState<string | null>(null);

  const toggleGarment = (garmentId: string) => {
    const existingIndex = selectedGarments.findIndex(g => g.id === garmentId);
    
    if (existingIndex >= 0) {
      // Remove garment
      setSelectedGarments(selectedGarments.filter(g => g.id !== garmentId));
    } else {
      // Add garment with default size M
      setSelectedGarments([...selectedGarments, { id: garmentId, size: 'M' }]);
    }
  };

  const handleSizeChange = (garmentId: string, size: string) => {
    setSelectedGarments(
      selectedGarments.map(g => 
        g.id === garmentId 
          ? { ...g, size: size as GarmentItem['size'] } 
          : g
      )
    );
  };

  const getIcon = (category: string) => {
    switch(category) {
      case 'upper': return '👕';
      case 'lower': return '👖';
      case 'full': return '👗';
      default: return '👕';
    }
  };

  const isSelected = (garmentId: string) => {
    return selectedGarments.some(g => g.id === garmentId);
  };

  const getSelectedSize = (garmentId: string) => {
    const garment = selectedGarments.find(g => g.id === garmentId);
    return garment ? garment.size : 'M';
  };

  return (
    <div className="garment-grid">
      {garments.map((garment) => {
        const selected = isSelected(garment.id);
        const selectedSize = getSelectedSize(garment.id);
        const isHovered = hoveredGarment === garment.id;
        
        return (
          <div
            key={garment.id}
            className={`garment-item ${selected ? 'selected' : ''}`}
            onMouseEnter={() => setHoveredGarment(garment.id)}
            onMouseLeave={() => setHoveredGarment(null)}
            style={{
              border: `2px solid ${selected ? garment.color : '#ddd'}`,
              backgroundColor: selected ? `${garment.color}20` : 'white',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <div 
              onClick={() => !disabled && toggleGarment(garment.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            >
              <span style={{ fontSize: '2em' }}>{getIcon(garment.category)}</span>
              <span style={{ fontWeight: 'bold', marginTop: '4px' }}>{garment.name}</span>
            </div>
            
            {selected && (
              <div 
                style={{
                  marginTop: '4px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span style={{ fontSize: '12px', color: '#666' }}>Size:</span>
                <GarmentSizeSelector
                  garmentId={garment.id}
                  selectedSize={selectedSize}
                  onSizeChange={handleSizeChange}
                  disabled={disabled}
                />
              </div>
            )}
            
            {selected && (
              <div 
                style={{
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '4px'
                }}
              >
                {selectedSize} selected
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GarmentControls;