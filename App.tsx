import { NavigationContainer } from '@react-navigation/native';

import { ChooseDocumentScreen } from './src/screens/ChooseDocumentScreen';
import { TimetableScreen } from './src/screens/TimetableScreen';
import { Stack } from './src/screens/Utils';

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="ChooseDocumentScreen"
          component={ChooseDocumentScreen}
        />
        <Stack.Screen name="TimetableScreen" component={TimetableScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
