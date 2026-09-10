import 'react-native-gesture-handler';
import { Platform, LogBox } from 'react-native';
import MobileApp from './apps/mobile/App';

console.log('[NEXXUS] Root App.js loaded');

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

export default MobileApp;
