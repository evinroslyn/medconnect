import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import React from 'react';

export interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
  weight?: SymbolWeight;
}

export function IconSymbol({ name, size = 24, color = '#000', weight = 'regular' }: IconSymbolProps) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      type="hierarchical"
    />
  );
}



