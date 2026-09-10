import { Platform, LogBox } from 'react-native';
import MobileApp from './apps/mobile/App';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

export default MobileApp;
