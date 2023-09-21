import { StatusBar } from "expo-status-bar";
import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as fs from "expo-file-system";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const Stack = createNativeStackNavigator();

async function handleDocument() {
  const document = await DocumentPicker.getDocumentAsync();
  return document;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
  },
  scrollView: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 42,
  },
});


function convertSheetToSchedule(sheet, choosedGroup) {
  const KEYS_TO_FOUND = ["Дни", "Время", choosedGroup];
  const foundKeys = {};
  sheet.forEach((row) => {
    var addNext = false;
    for (let key in row) {
      if (KEYS_TO_FOUND.includes(row[key])) {
        foundKeys[row[key]] = key;
        if (row[key] === choosedGroup) {
          addNext = true;
        }
      } else if (addNext) {
        addNext = false;
        foundKeys[row[key]] = key;
      }
    }
  });
  console.log("Found keys: " + JSON.stringify(foundKeys));
  let prevDay = null;
  return sheet.map((row) => {
    // console.log(row);
    return Object.values(foundKeys).map((key) => {
      if (key === foundKeys["Дни"]) {
        if (typeof row[key] === "undefined" || !(key in row)) {
          if (!prevDay) {
            return undefined;
          }
          return prevDay;
        } else {
          prevDay = row[key];
        }
      } else if (
        key === foundKeys["Время"] && typeof row[key] === "undefined"
      ) {
        return "";
      }
      if (typeof row[key] === "string") {
        return row[key].replace(/\n/g, " ");
      } else {
        return row[key];
      }
    });
  })
    .filter((value) => {
      return typeof value !== 'undefined' && value.every((x) => typeof x === "string" || typeof x === 'number');
    });
}

function getGroupsFromSheet(sheet) {
  const pattern = /^(\d{2})([А-Я]{1,4})(\d{1})$/;
  const groups = [];
  for (const row of sheet) {
    var stop = false;
    Object.values(row).forEach((item) => {
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

function groupBy(sequence, tagGetter) {
  let res = {};
  for (const kek of sequence) {
    const tag = tagGetter(kek)
    if (tag in res) {
      res[tag].push(kek);
    } else {
      res[tag] = [kek];
    }
  }
  return res
}

function Sheet({ workbook, name }) {
  const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
    header: "A",
  });
  // console.log(sheet)
  const [isGroupChoosed, setIsGroupChoosed] = useState(false);
  const [choosedGroupName, setChoosedGroupName] = useState("");
  if (isGroupChoosed) {
    const schedule = convertSheetToSchedule(sheet, choosedGroupName);
    const groupedShedule = groupBy(schedule, (arr) => arr[0])
    console.log(groupedShedule)
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
        >
          { groupedShedule && Object.keys(groupedShedule).map((item) => {
            return (
              <View> 
                <Text> {item} </Text>
                { groupedShedule[item].map((arr, i) => <Button key={i} title={arr.slice(1).join(' ')} />) }
              </View>
            )
          }) }
        </ScrollView>
      </SafeAreaView>
    );
  } else {
    const groups = getGroupsFromSheet(sheet);
    return (
      <View>
        <Text>Choose your group</Text>
        {groups && groups.map((name, i) => {
          return (
            <Button
              key={i}
              title={name}
              onPress={() => {
                setIsGroupChoosed(true);
                setChoosedGroupName(name);
                console.log("Choosed name " + name);
              }}
            />
          );
        })}
      </View>
    );
  }
}

function TimetableScreen({ navigation }) {
  const [parsedDocument, setParsedDocument] = useState(null);
  useEffect(() => {
    const fetchDoc = async (setDocument) => {
      const doc = await handleDocument();
      const uri = doc.assets[0].uri;
      const docString = await fs.readAsStringAsync(uri, { encoding: "base64" });
      const workbook = XLSX.read(docString, { type: "base64" });
      setDocument(workbook);
    };
    fetchDoc(setParsedDocument);
  }, [setParsedDocument]);

  const [isSheetChoosed, setIsSheetChoosed] = useState(false);
  const [choosedSheetName, setChoosedSheetName] = useState("");
  if (isSheetChoosed) {
    return <Sheet workbook={parsedDocument} name={choosedSheetName} />;
  } else {
    if (!parsedDocument) {
      return <Text>Parsing data...</Text>;
    }
    return (
      <View>
        <Text>Choose your sheet:</Text>
        {parsedDocument && parsedDocument.SheetNames.map((x, i) => {
          return (
            <Button
              title={x}
              key={i}
              onPress={() => {
                setIsSheetChoosed(true);
                setChoosedSheetName(x);
              }}
            />
          );
        })}
      </View>
    );
  }
}

function ChooseDocumentScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>Choose your document with timetable</Text>
      <StatusBar style="auto" />
      <Button
        title="choose your document"
        onPress={() => navigation.navigate("TimetableScreen")}
      />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Choose document" component={ChooseDocumentScreen} />
        <Stack.Screen name="TimetableScreen" component={TimetableScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
