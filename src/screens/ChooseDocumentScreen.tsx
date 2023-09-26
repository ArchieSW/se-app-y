import { StatusBar } from 'expo-status-bar';
import { Button, Text, View } from 'react-native';

import { useGlobalNavigation } from './Utils';
import { styles } from '../components/Sheet';

export function ChooseDocumentScreen() {
  const navigation = useGlobalNavigation();
  return (
    <View style={styles.container}>
      <Text>Choose your document with timetable</Text>
      <StatusBar style="auto" />
      <Button
        title="choose your document"
        onPress={() => navigation.navigate('TimetableScreen')}
      />
    </View>
  );
}
