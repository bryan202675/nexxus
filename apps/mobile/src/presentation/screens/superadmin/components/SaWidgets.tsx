import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { useAdminAppearance } from '../../admin/adminTheme';

const Text = AdminTranslatedText;

/** Hook único: expone el modo claro/oscuro global (sin paleta de colores). */
export function useSaTheme() {
  const { mode, toggleMode } = useAdminAppearance();
  const theme: any = {};
  return { theme, mode, toggleMode };
}

const AVATAR_COLORS = ['#7551FF', '#422AFB', '#3311DB', '#2111A5', '#190793', '#11047A', '#8171FC'];
export function colorFromSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initialsFrom(name: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Anima entrada fade+slide reutilizable para secciones de pantalla. */
export function useSaEntrance() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);
  return { fadeAnim, slideAnim };
}

// ---------------------------------------------------------------------------
// Hero banner
// ---------------------------------------------------------------------------

export function SaHeroBanner({ eyebrow, title, subtitle, theme, compact }: {
  eyebrow: string;
  title: string;
  subtitle: string;
  theme?: any;
  compact?: boolean;
}) {
  return (
    <View>
      <Text>{eyebrow}</Text>
      <Text>{title}</Text>
      <Text>{subtitle}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Icon box
// ---------------------------------------------------------------------------

export function SaIconBox({ icon, size = 34, tone = 'neutral', theme }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  tone?: SaBadgeTone;
  theme?: any;
}) {
  return (
    <View>
      <MaterialIcons name={icon} size={Math.round(size * 0.52)} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

export function SaKpiCard({ label, value, delta, tone = 'neutral', icon, theme, index = 0 }: {
  label: string;
  value: string;
  delta?: string;
  tone?: 'positive' | 'neutral' | 'warning';
  icon?: keyof typeof MaterialIcons.glyphMap;
  theme?: any;
  index?: number;
}) {
  return (
    <View>
      {icon ? (
        <View>
          <MaterialIcons name={icon} size={20} />
        </View>
      ) : null}
      <View>
        <Text numberOfLines={1}>{label}</Text>
        <Text numberOfLines={1}>{value}</Text>
        {delta ? <Text numberOfLines={1}>{delta}</Text> : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section card wrapper
// ---------------------------------------------------------------------------

export function SaSectionCard({ title, action, onAction, theme, style, index = 0, children }: {
  title?: string;
  action?: string;
  onAction?: () => void;
  theme?: any;
  style?: any;
  index?: number;
  children: React.ReactNode;
}) {
  return (
    <View>
      {title ? (
        <View>
          <Text>{title}</Text>
          {action ? (
            <TouchableOpacity onPress={onAction} disabled={!onAction}>
              <Text>{action}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Data table primitives
// ---------------------------------------------------------------------------

export function SaTableHeader({ columns, theme }: { columns: { label: string; flex?: number }[]; theme?: any }) {
  return (
    <View>
      {columns.map((col, i) => (
        <Text key={i} numberOfLines={1}>
          {col.label}
        </Text>
      ))}
    </View>
  );
}

export function SaTableRow({ children, theme, onPress, last }: { children: React.ReactNode; theme?: any; onPress?: () => void; last?: boolean }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper {...(onPress ? { onPress, activeOpacity: 0.75 } : {})}>
      {children}
    </Wrapper>
  );
}

export function SaCell({ children, flex = 1 }: { children: React.ReactNode; flex?: number }) {
  return <View>{children}</View>;
}

// ---------------------------------------------------------------------------
// Avatar chip + status badge
// ---------------------------------------------------------------------------

export function SaAvatarChip({ name, round = false, size = 32 }: { name: string; round?: boolean; size?: number }) {
  return (
    <View>
      <Text>{initialsFrom(name)}</Text>
    </View>
  );
}

export type SaBadgeTone = 'positive' | 'neutral' | 'warning' | 'danger' | 'info';

export function SaStatusBadge({ label, tone = 'neutral', theme }: { label: string; tone?: SaBadgeTone; theme?: any }) {
  return (
    <View>
      <Text numberOfLines={1}>{label}</Text>
    </View>
  );
}

/** Estado como icono + texto. */
export function SaStatusIndicator({ label, tone = 'neutral', theme }: { label: string; tone?: SaBadgeTone; theme?: any }) {
  const iconMap: Record<SaBadgeTone, keyof typeof MaterialIcons.glyphMap | null> = {
    positive: 'check-circle',
    danger: 'cancel',
    warning: 'error',
    info: 'info',
    neutral: null,
  };
  const iconName = iconMap[tone];
  return (
    <View>
      {iconName ? <MaterialIcons name={iconName} size={15} /> : null}
      <Text numberOfLines={1}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bar chart (simple, no external deps)
// ---------------------------------------------------------------------------

export function SaBarChart({ data, theme, height = 180 }: { data: { label: string; value: number }[]; theme?: any; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View>
      {data.map((d, i) => {
        const h = Math.max(6, Math.round((d.value / max) * (height - 28)));
        return (
          <View key={i}>
            <View>
              <View />
            </View>
            <Text>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Progress bar (plan distribution)
// ---------------------------------------------------------------------------

export function SaProgressBar({ label, pct, color, theme }: { label: string; pct: number; color?: string; theme?: any }) {
  return (
    <View>
      <View>
        <Text numberOfLines={1}>{label}</Text>
        <Text>{Math.round(pct)}%</Text>
      </View>
      <View>
        <View />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Donut chart
// ---------------------------------------------------------------------------

export function SaDonutChart({ data, theme, size = 168 }: {
  data: { label: string; value: number; color: string }[];
  theme?: any;
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const strokeWidth = size * 0.16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetAcc = 0;
  return (
    <View>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * circumference;
          const circle = (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offsetAcc}
              fill="none"
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          );
          offsetAcc += dash;
          return circle;
        })}
      </Svg>
      <View>
        {data.map((d, i) => (
          <React.Fragment key={i}>
            <View>
              <Text numberOfLines={1}>{d.label}</Text>
              <Text>
                {Math.round((d.value / total) * 100)}%
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Activity row
// ---------------------------------------------------------------------------

export function SaActivityRow({ icon, title, subtitle, badge, badgeTone = 'neutral', theme }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  badge?: string;
  badgeTone?: SaBadgeTone;
  theme?: any;
}) {
  return (
    <View>
      <View>
        <MaterialIcons name={icon} size={16} />
      </View>
      <View>
        <Text numberOfLines={1}>{title}</Text>
        <Text numberOfLines={1}>{subtitle}</Text>
      </View>
      {badge ? <SaStatusBadge label={badge} tone={badgeTone} theme={theme} /> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------

export function SaToggle({ value, onChange, theme }: { value: boolean; onChange: () => void; theme?: any }) {
  return (
    <TouchableOpacity onPress={onChange} activeOpacity={0.8}>
      <View />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Filter pill
// ---------------------------------------------------------------------------

export function SaFilterPill({ label, active, onPress, theme }: { label: string; active: boolean; onPress: () => void; theme?: any }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Text>{label}</Text>
    </TouchableOpacity>
  );
}
