import { useState, useEffect } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState(0);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setLabel('');
      setColor('');
      return;
    }

    let score = 0;

    // Length check (min 8 chars)
    if (password.length >= 8) score++;
    
    // Lowercase letters
    if (/[a-z]/.test(password)) score++;
    
    // Uppercase letters
    if (/[A-Z]/.test(password)) score++;
    
    // Numbers
    if (/\d/.test(password)) score++;
    
    // Special characters
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Cap at 4 levels
    score = Math.min(score, 4);

    // Map score to label and color
    switch (score) {
      case 0:
      case 1:
        setStrength(1);
        setLabel('Weak - 弱');
        setColor('bg-red-500');
        break;
      case 2:
        setStrength(2);
        setLabel('Fair - 一般');
        setColor('bg-orange-500');
        break;
      case 3:
        setStrength(3);
        setLabel('Good - 良好');
        setColor('bg-yellow-500');
        break;
      case 4:
      case 5:
        setStrength(4);
        setLabel('Strong - 强');
        setColor('bg-green-500');
        break;
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-1 space-y-1">
      {/* Progress bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              level <= strength ? color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {/* Label */}
      <p className="text-xs text-[#717786]">{label}</p>
      
      {/* Tips for weak passwords */}
      {strength === 1 && (
        <p className="text-xs text-red-500">
          • At least 8 characters<br/>
          • Mix uppercase and lowercase letters<br/>
          • Include numbers and special characters
        </p>
      )}
    </div>
  );
}
