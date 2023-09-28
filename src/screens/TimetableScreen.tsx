import * as fs from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';
import * as XLSX from 'xlsx';

import { handleDocument } from '../Utils';
import { Sheet } from '../components/Sheet';
import { useScheduleStore } from '../stores/Schedule';

export function TimetableScreen() {
  const updateSchedule = useScheduleStore((state) => state.updateSchedule);
  useEffect(() => {
    updateSchedule();
  }, []);
  const schedule = useScheduleStore((state) => state.years);
  return (
    <View>
      {schedule.map((value, idx) => {
        return (
          <ScrollView key={'view1' + idx}>
            <Text>{value.yearName}</Text>
            {value.groups.map((group, idx) => {
              return (
                <View key={'view2' + idx}>
                  {Object.keys(group).map((groupName, idx) => {
                    return (
                      <View key={'view3' + idx}>
                        <Text>{groupName}</Text>
                        {group[groupName].map((lesson, idx) => {
                          return (
                            <View key={'view4 ' + idx}>
                              <Text> {Object.values(lesson).concat(' ')} </Text>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        );
      })}
    </View>
  );
}
