import React from 'react';

interface FemaleMeasurements {
  height: number;
  weight: number;
  bust: number;
  waist: number;
  hips: number;
}

interface FemaleControlsProps {
  form: FemaleMeasurements;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  disabled?: boolean;
}

const FemaleControls: React.FC<FemaleControlsProps> = ({ form, setForm, disabled = false }) => {
  
  // Ranges for each measurement
  const ranges = {
    height: { min: 140, max: 200 },
    weight: { min: 40, max: 100 },
    bust: { min: 70, max: 130 },
    waist: { min: 50, max: 100 },
    hips: { min: 80, max: 140 }
  };

  // For inverted parameters (bust, waist, hips)
  // When slider increases, we want the stored value to decrease
  const handleChange = (field: keyof FemaleMeasurements, sliderValue: number) => {
    const invertedFields = ['bust', 'waist', 'hips'];
    
    if (invertedFields.includes(field)) {
      // Invert: if slider goes up, stored value goes down
      const range = ranges[field];
      const invertedValue = range.max + range.min - sliderValue;
      setForm((prev: FemaleMeasurements) => ({ ...prev, [field]: invertedValue }));
    } else {
      // Normal fields (height, weight)
      setForm((prev: FemaleMeasurements) => ({ ...prev, [field]: sliderValue }));
    }
  };

  // For display, we need to invert back the stored values
  const getDisplayValue = (field: keyof FemaleMeasurements): number => {
    const invertedFields = ['bust', 'waist', 'hips'];
    
    if (invertedFields.includes(field)) {
      const range = ranges[field];
      return range.max + range.min - form[field];
    }
    return form[field];
  };

  const getHeightLabel = (h: number) => {
    if (h < 150) return 'Very Short';
    if (h < 160) return 'Short';
    if (h < 170) return 'Average';
    if (h < 180) return 'Tall';
    return 'Very Tall';
  };

  const getWeightLabel = (w: number) => {
    if (w < 50) return 'Very Light';
    if (w < 60) return 'Light';
    if (w < 70) return 'Average';
    if (w < 85) return 'Heavy';
    return 'Very Heavy';
  };

  const getBustLabel = (b: number) => {
    if (b < 75) return 'Very Small';
    if (b < 85) return 'Small';
    if (b < 100) return 'Average';
    if (b < 115) return 'Large';
    return 'Very Large';
  };

  const getWaistLabel = (w: number) => {
    if (w < 55) return 'Very Slim';
    if (w < 65) return 'Slim';
    if (w < 80) return 'Average';
    if (w < 95) return 'Full';
    return 'Very Full';
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
        <div className="control-value" style={{ color: '#764ba2', fontWeight: 'bold' }}>
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
        <div className="control-value" style={{ color: '#764ba2', fontWeight: 'bold' }}>
          {getWeightLabel(getDisplayValue('weight'))}
        </div>
      </div>

      <div className="control-item">
        <label>Bust: {getDisplayValue('bust')} cm</label>
        <input
          type="range"
          min={ranges.bust.min}
          max={ranges.bust.max}
          step="1"
          value={getDisplayValue('bust')}
          onChange={(e) => handleChange('bust', Number(e.target.value))}
          disabled={disabled}
        />
        <div className="control-value" style={{ color: '#764ba2', fontWeight: 'bold' }}>
          {getBustLabel(getDisplayValue('bust'))}
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
        <div className="control-value" style={{ color: '#764ba2', fontWeight: 'bold' }}>
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
        <div className="control-value" style={{ color: '#764ba2', fontWeight: 'bold' }}>
          {getHipsLabel(getDisplayValue('hips'))}
        </div>
      </div>

      <div className="control-item">
        <label>Waist-Hip Ratio: {(getDisplayValue('waist') / getDisplayValue('hips')).toFixed(2)}</label>
        <div className="control-value" style={{ color: '#764ba2', fontWeight: 'bold' }}>
          {getDisplayValue('waist') / getDisplayValue('hips') < 0.7 ? 'Hourglass' : 
           getDisplayValue('waist') / getDisplayValue('hips') < 0.8 ? 'Balanced' : 'Straight'}
        </div>
      </div>
    </div>
  );
};

export default FemaleControls;