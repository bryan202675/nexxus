import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export const SaIconGlobe = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Circle cx="12" cy="12" r="9" />
    <Path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" />
  </Svg>
);

export const SaIconBuilding = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Rect x="4" y="3" width="16" height="18" rx="1.5" />
    <Path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" />
  </Svg>
);

export const SaIconUsers = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Circle cx="9" cy="8" r="3.2" />
    <Path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
    <Circle cx="17.5" cy="7.5" r="2.6" />
    <Path d="M15.8 12.3c2.9.3 5.2 2.7 5.2 5.7" />
  </Svg>
);

export const SaIconSparkles = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
    <Path d="M19 15l.7 1.9L21.5 17.6l-1.9.7L19 20.2l-.7-1.9-1.9-.7 1.9-.7L19 15z" />
  </Svg>
);

export const SaIconCard = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Rect x="3" y="5.5" width="18" height="13" rx="2" />
    <Path d="M3 10h18M7 15h4" />
  </Svg>
);

export const SaIconAudit = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Rect x="4" y="3" width="14" height="18" rx="1.5" />
    <Path d="M8 8h6M8 12h6" />
    <Circle cx="17" cy="17" r="3.2" />
    <Path d="M19.3 19.3L21.5 21.5" />
  </Svg>
);

export const SaIconSupport = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Path d="M4 13a8 8 0 0116 0" />
    <Rect x="3" y="13" width="4" height="6" rx="1.5" />
    <Rect x="17" y="13" width="4" height="6" rx="1.5" />
    <Path d="M20 19v1a3 3 0 01-3 3h-3" />
  </Svg>
);

export const SaIconSliders = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Path d="M4 6h9M17 6h3M4 12h3M9 12h11M4 18h13M20 18h0" />
    <Circle cx="15" cy="6" r="2" />
    <Circle cx="7" cy="12" r="2" />
    <Circle cx="17" cy="18" r="2" />
  </Svg>
);

export const SaIconSearch = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Circle cx="11" cy="11" r="7" />
    <Path d="M21 21l-4.3-4.3" />
  </Svg>
);

export const SaIconBell = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" />
    <Path d="M10 20a2 2 0 004 0" />
  </Svg>
);

export const SaIconActivity = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Path d="M3 12h4l2 7 4-14 2 7h6" />
  </Svg>
);

export const SaIconSun = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Circle cx="12" cy="12" r="4.2" />
    <Path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12h2.5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" />
  </Svg>
);

export const SaIconMoon = ({ size = 24, color = 'currentColor', strokeWidth = 1.8 }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} width={size} height={size}>
    <Path d="M20 13.5A8.5 8.5 0 1110.5 4a6.8 6.8 0 009.5 9.5z" />
  </Svg>
);
