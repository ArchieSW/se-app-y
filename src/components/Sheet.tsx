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
import {
  getGroupsFromSheet,
  convertSheetToSchedule,
  useScheduleStore,
} from '../stores/Schedule';

export type SheetRowObject = {
  [K in Letters]: string | number;
}; // TODO: extend this type

export type Letters = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type SheetComponentProps = {
  workbook: XLSX.WorkBook;
  name: string;
};

export function Sheet() {
  useScheduleStore((state) => state.years);
}
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
