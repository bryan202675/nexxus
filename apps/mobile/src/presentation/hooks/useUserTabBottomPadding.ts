import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useUserTabBottomPadding(iosPadding: number): number {
  const insets = useSafeAreaInsets();

  if (Platform.OS !== 'android') return iosPadding;

  return Math.max(iosPadding, insets.bottom + 62);
}
