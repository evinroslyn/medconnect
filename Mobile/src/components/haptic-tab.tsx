import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import React from 'react';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // Add haptic feedback on press
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
          // Ignore haptic errors (e.g., on unsupported devices)
        });
        props.onPressIn?.(ev);
      }}
    />
  );
}

