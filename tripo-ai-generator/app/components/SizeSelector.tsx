'use client';

import { useState } from 'react';

interface SizeSelectorProps {
  onSizeChange: (sizes: string[]) => void;
  disabled?: boolean;
  selectedSizes?: string[];
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export default function SizeSelector({ onSizeChange, disabled, selectedSizes = ['M'] }: SizeSelectorProps) {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedSizes);

  const handleSizeToggle = (size: string) => {
    let newSizes: string[];
    
    if (localSelected.includes(size)) {
      newSizes = localSelected.filter(s => s !== size);
      if (newSizes.length === 0) return;
    } else {
      newSizes = [...localSelected, size];
    }
    
    setLocalSelected(newSizes);
    onSizeChange(newSizes);
  };

  const handleSelectAll = () => {
    setLocalSelected(AVAILABLE_SIZES);
    onSizeChange(AVAILABLE_SIZES);
  };

  const handleClearAll = () => {
    setLocalSelected(['M']);
    onSizeChange(['M']);
  };

  return (
    <div style={styles.container}>
      <label style={styles.label}>Select Sizes to Generate:</label>
      <p style={styles.hint}>Base model (M) will be scaled to selected sizes</p>
      
      <div style={styles.sizeGrid}>
        {AVAILABLE_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => handleSizeToggle(size)}
            disabled={disabled}
            style={{
              ...styles.sizeButton,
              ...(localSelected.includes(size) ? styles.selectedSize : {}),
              ...(disabled ? styles.disabledButton : {})
            }}
          >
            {size}
          </button>
        ))}
      </div>
      
      <div style={styles.actions}>
        <button onClick={handleSelectAll} disabled={disabled} style={styles.actionButton}>
          Select All
        </button>
        <button onClick={handleClearAll} disabled={disabled} style={styles.actionButton}>
          Reset to M
        </button>
      </div>
      
      <p style={styles.selectedText}>
        Selected: {localSelected.length} size{localSelected.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '20px',
    padding: '15px',
    background: '#f5f5f5',
    borderRadius: '8px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold' as const,
    color: '#333',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '10px',
  },
  sizeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 1fr))',
    gap: '8px',
    marginBottom: '10px',
  },
  sizeButton: {
    padding: '8px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#ddd',
    background: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    transition: 'all 0.2s',
  },
  selectedSize: {
    background: '#667eea',
    color: 'white',
    borderColor: '#667eea',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  actionButton: {
    padding: '5px 10px',
    background: '#e0e0e0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  selectedText: {
    fontSize: '12px',
    color: '#666',
    margin: 0,
  },
};