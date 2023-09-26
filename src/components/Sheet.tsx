import { useState } from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as XLSX from 'xlsx';

import { groupBy } from '../Utils';
import { getGroupsFromSheet, convertSheetToSchedule } from '../stores/Schedule';

export function Sheet({ workbook, name }: SheetComponentProps) {
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
export type SheetRowObject = {
  [K in Letters]: string | number;
}; // TODO: extend this type

export type Letters = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type SheetComponentProps = {
  workbook: XLSX.WorkBook;
  name: string;
};
export const styles = StyleSheet.create({
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
