import { NavigationContainer, useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as fs from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as XLSX from 'xlsx';

type StackParams = {
  TimetableScreen: undefined;
  ChooseDocumentScreen: undefined;
};

const Stack = createNativeStackNavigator<StackParams>();

async function handleDocument(): Promise<DocumentPicker.DocumentPickerResult> {
  const document = await DocumentPicker.getDocumentAsync();
  return document;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 42,
  },
});

function convertSheetToSchedule(
  sheet: SheetRowObject[],
  chosenGroup: string,
): string[][] {
  const KEYS_TO_FOUND = ['Дни', 'Время', chosenGroup];
  const foundKeys: { [k: string]: keyof SheetRowObject } = {};
  sheet.forEach((row) => {
    let addNext = false;
    let key: keyof typeof row;
    for (key in row) {
      const element = row[key];
      if (typeof element == 'number') {
        continue;
      }
      if (KEYS_TO_FOUND.includes(element)) {
        foundKeys[element] = key;
        if (row[key] === chosenGroup) {
          addNext = true;
        }
      } else if (addNext) {
        addNext = false;
        foundKeys[row[key]] = key;
      }
    }
  });
  console.log('Found keys: ' + JSON.stringify(foundKeys));
  let prevDay: string | null = null;
  return sheet
    .map((row) => {
      // console.log(row);
      return Object.values(foundKeys).map<undefined | number | string>(
        (key) => {
          const element = row[key];
          if (key === foundKeys['Дни']) {
            if (typeof element === 'undefined' || !(key in row)) {
              if (!prevDay) {
                return undefined;
              }
              return prevDay;
            } else {
              if (typeof element !== 'string') {
                throw Error('sheet format is broken. Under Дни number');
              }
              prevDay = element;
            }
          } else if (
            key === foundKeys['Время'] &&
            typeof element === 'undefined'
          ) {
            return '';
          }
          if (typeof element === 'string') {
            return element.replace(/\n/g, ' ');
          } else {
            return element;
          }
        },
      );
    })
    .filter((value) => typeof value !== 'undefined')
    .filter((value) =>
      value.every((x) => typeof x === 'string' || typeof x === 'number'),
    )
    .map((value) => value.map((x) => x!.toString()));
}

function getGroupsFromSheet(sheet: SheetRowObject[]): string[] {
  const pattern = /^(\d{2})([А-Я]{1,4})(\d{1})$/;
  const groups: string[] = [];
  for (const row of sheet) {
    let stop = false;
    Object.values(row)
      .filter((value): value is string => typeof value === 'string')
      .forEach((item) => {
        if (item && item.trim().match(pattern)) {
          groups.push(item);
          stop = true;
        }
      });
    if (stop) {
      break;
    }
  }
  return groups;
}

function groupBy<S, T extends keyof any>(
  sequence: S[],
  tagGetter: (item: S) => T,
): { [K in T]: S[] } {
  const res = {} as { [K in T]: S[] };
  for (const kek of sequence) {
    const tag = tagGetter(kek);
    if (tag in res) {
      res[tag].push(kek);
    } else {
      res[tag] = [kek];
    }
  }
  return res;
}

type SheetComponentProps = {
  workbook: XLSX.WorkBook;
  name: string;
};

// TODO: extend this type
type Letters = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
type SheetRowObject = { [K in Letters]: string | number };

function Sheet({ workbook, name }: SheetComponentProps) {
  const sheet = XLSX.utils.sheet_to_json<SheetRowObject>(
    workbook.Sheets[name],
    {
      header: 'A',
    },
  );
  const [isGroupChosen, setIsGroupChosen] = useState(false);
  const [chosenGroupName, setChosenGroupName] = useState('');
  if (isGroupChosen) {
    const schedule = convertSheetToSchedule(sheet, chosenGroupName);
    const groupedSchedule = groupBy(schedule, (arr) => arr[0]);
    console.log(groupedSchedule);
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          {groupedSchedule &&
            Object.keys(groupedSchedule).map((item, idx) => {
              return (
                <View key={idx}>
                  <Text>{item}</Text>
                  {groupedSchedule[item].map((arr, i) => (
                    <Button key={i} title={arr.slice(1).join(' ')} />
                  ))}
                </View>
              );
            })}
        </ScrollView>
      </SafeAreaView>
    );
  } else {
    const groups = getGroupsFromSheet(sheet);
    console.log(groups);

    return (
      <View>
        <Text>Choose your group</Text>
        {groups &&
          groups.map((name, i) => {
            return (
              <Button
                key={i}
                title={name}
                onPress={() => {
                  setIsGroupChosen(true);
                  setChosenGroupName(name);
                  console.log('Chosen name ' + name);
                }}
              />
            );
          })}
      </View>
    );
  }
}

function TimetableScreen() {
  const [parsedDocument, setParsedDocument] = useState<XLSX.WorkBook | null>(
    null,
  );
  useEffect(() => {
    const fetchDoc = async (setDocument: typeof setParsedDocument) => {
      const doc = await handleDocument();
      if (doc.assets == null) {
        return;
      }
      const uri = doc.assets[0].uri;
      const docString = await fs.readAsStringAsync(uri, { encoding: 'base64' });
      const workbook = XLSX.read(docString, { type: 'base64' });
      setDocument(workbook);
    };
    fetchDoc(setParsedDocument);
  }, []);

  const [isSheetChosen, setIsSheetChosen] = useState(false);
  const [chosenSheetName, setChosenSheetName] = useState('');
  if (isSheetChosen) {
    if (parsedDocument == null) {
      return <Text>Error while parsing document</Text>;
    }
    return <Sheet workbook={parsedDocument} name={chosenSheetName} />;
  } else {
    if (!parsedDocument) {
      return <Text>Parsing data...</Text>;
    }
    return (
      <View>
        <Text>Choose your sheet:</Text>
        {parsedDocument &&
          parsedDocument.SheetNames.map((x, i) => {
            return (
              <Button
                title={x}
                key={i}
                onPress={() => {
                  setIsSheetChosen(true);
                  setChosenSheetName(x);
                }}
              />
            );
          })}
      </View>
    );
  }
}

function ChooseDocumentScreen() {
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

function useGlobalNavigation() {
  return useNavigation<NativeStackNavigationProp<StackParams>>();
}

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
