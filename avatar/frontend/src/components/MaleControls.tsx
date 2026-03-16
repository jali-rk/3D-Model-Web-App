import React from 'react';

interface MaleMeasurements {
  height: number;
  weight: number;
  shoulder: number;
  chest: number;
  waist: number;
  hips: number;
}

interface MaleControlsProps {
  form: MaleMeasurements;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  disabled?: boolean;
}

const MaleControls: React.FC<MaleControlsProps> = ({ form, setForm, disabled = false }) => {
  
  // Ranges for each measurement
  const ranges = {
    height: { min: 150, max: 210 },
    weight: { min: 50, max: 120 },
    shoulder: { min: 35, max: 60 },
    chest: { min: 80, max: 140 },
    waist: { min: 60, max: 120 },
    hips: { min: 80, max: 140 }
  };

  // For inverted parameters (shoulder, chest, waist, hips)
  // When slider increases, we want the stored value to decrease
  const handleChange = (field: keyof MaleMeasurements, sliderValue: number) => {
    const invertedFields = ['shoulder', 'chest', 'waist', 'hips'];
    
    if (invertedFields.includes(field)) {
      // Invert: if slider goes up, stored value goes down
      const range = ranges[field];
      const invertedValue = range.max + range.min - sliderValue;
      setForm((prev: MaleMeasurements) => ({ ...prev, [field]: invertedValue }));
    } else {
      // Normal fields (height, weight)
      setForm((prev: MaleMeasurements) => ({ ...prev, [field]: sliderValue }));
    }
  };

  // For display, we need to invert back the stored values
  const getDisplayValue = (field: keyof MaleMeasurements): number => {
    const invertedFields = ['shoulder', 'chest', 'waist', 'hips'];
    
    if (invertedFields.includes(field)) {
      const range = ranges[field];
      return range.max + range.min - form[field];
    }
    return form[field];
  };

  const getHeightLabel = (h: number) => {
    if (h < 160) return 'Very Short';
    if (h < 170) return 'Short';
    if (h < 180) return 'Average';
    if (h < 190) return 'Tall';
    return 'Very Tall';
  };

  const getWeightLabel = (w: number) => {
    if (w < 60) return 'Very Light';
    if (w < 70) return 'Light';
    if (w < 85) return 'Average';
    if (w < 100) return 'Heavy';
    return 'Very Heavy';
  };

  const getShoulderLabel = (s: number) => {
    if (s < 40) return 'Very Narrow';
    if (s < 45) return 'Narrow';
    if (s < 50) return 'Average';
    if (s < 55) return 'Broad';
    return 'Very Broad';
  };

  const getChestLabel = (c: number) => {
    if (c < 85) return 'Very Small';
    if (c < 95) return 'Small';
    if (c < 110) return 'Average';
    if (c < 125) return 'Large';
    return 'Very Large';
  };

  const getWaistLabel = (w: number) => {
    if (w < 65) return 'Very Slim';
    if (w < 75) return 'Slim';
    if (w < 90) return 'Average';
    if (w < 105) return 'Large';
    return 'Very Large';
  };

  const getHipsLabel = (h: number) => {
    if (h < 85) return 'Very Narrow';
    if (h < 95) return 'Narrow';
    if (h < 110) return 'Average';
    if (h < 125) return 'Wide';
    return 'Very Wide';
  };

  return (
    <div className="controls">
      <div className="control-item">
        <label>Height: {getDisplayValue('height')} cm</label>
        <input
          type="range"
          min={ranges.height.min}
          max={ranges.height.max}
          step="1"
          value={getDisplayValue('height')}
          onChange={(e) => handleChange('height', Number(e.target.value))}
          disabled={disabled}
        />
        <div className="control-value" style={{ color: '#667eea', fontWeight: 'bold' }}>
          {getHeightLabel(getDisplayValue('height'))}
        </div>
      </div>

      <div className="control-item">
        <label>Weight: {getDisplayValue('weight')} kg</label>
        <input
          type="range"
          min={ranges.weight.min}
          max={ranges.weight.max}
          step="1"
          value={getDisplayValue('weight')}
          onChange={(e) => handleChange('weight', Number(e.target.value))}
          disabled={disabled}
        />
        <div className="control-value" style={{ color: '#667eea', fontWeight: 'bold' }}>
          {getWeightLabel(getDisplayValue('weight'))}
        </div>
      </div>

      <div className="control-item">
        <label>Shoulder: {getDisplayValue('shoulder')} cm</label>
        <input
          type="range"
          min={ranges.shoulder.min}
          max={ranges.shoulder.max}
          step="1"
          value={getDisplayValue('shoulder')}
          onChange={(e) => handleChange('shoulder', Number(e.target.value))}
          disabled={disabled}
        />
        <div className="control-value" style={{ color: '#667eea', fontWeight: 'bold' }}>
          {getShoulderLabel(getDisplayValue('shoulder'))}
        </div>
      </div>

      <div className="control-item">
        <label>Chest: {getDisplayValue('chest')} cm</label>
        <input
          type="range"
          min={ranges.chest.min}
          max={ranges.chest.max}
          step="1"
          value={getDisplayValue('chest')}
          onChange={(e) => handleChange('chest', Number(e.target.value))}
          disabled={disabled}
        />
        <div className="control-value" style={{ color: '#667eea', fontWeight: 'bold' }}>
          {getChestLabel(getDisplayValue('chest'))}
        </div>
      </div>

      <div className="control-item">
        <label>Waist: {getDisplayValue('waist')} cm</label>
        <input
          type="range"
          min={ranges.waist.min}
          max={ranges.waist.max}
          step="1"
          value={getDisplayValue('waist')}
          onChange={(e) => handleChange('waist', Number(e.target.value))}
          disabled={disabled}
        />
        <div className="control-value" style={{ color: '#667eea', fontWeight: 'bold' }}>
          {getWaistLabel(getDisplayValue('waist'))}
        </div>
      </div>

      <div className="control-item">
        <label>Hips: {getDisplayValue('hips')} cm</label>
        <input
          type="range"
          min={ranges.hips.min}
          max={ranges.hips.max}
          step="1"
          value={getDisplayValue('hips')}
          onChange={(e) => handleChange('hips', Number(e.target.value))}
          disabled={disabled}
        />
        <div className="control-value" style={{ color: '#667eea', fontWeight: 'bold' }}>
          {getHipsLabel(getDisplayValue('hips'))}
        </div>
      </div>
    </div>
  );
};

export default MaleControls;