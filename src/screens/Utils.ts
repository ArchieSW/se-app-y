import { useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

export type StackParams = {
  TimetableScreen: undefined;
  ChooseDocumentScreen: undefined;
};

export function useGlobalNavigation() {
  return useNavigation<NativeStackNavigationProp<StackParams>>();
}
export const Stack = createNativeStackNavigator<StackParams>();
