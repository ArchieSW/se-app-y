import * as fs from 'expo-file-system';
import * as XLSX from 'xlsx';
import { create } from 'zustand';

import { handleDocument } from '../Utils';
import { SheetRowObject } from '../components/Sheet';

type Lesson = { day: string; time: string; name: string; place: string };
type Group = { [key: string]: Lesson[] };
type YearOfEducation = { groups: Group[]; yearName: string };

interface Schedule {
  years: YearOfEducation[];
  updateSchedule: () => Promise<void>;
}

export const useScheduleStore = create<Schedule>((set) => ({
  years: [],
  updateSchedule: async () => {
    const document = await handleDocument();
    if (document.assets == null) {
      return;
    }
    const uri = document.assets[0].uri;
    const docString = await fs.readAsStringAsync(uri, { encoding: 'base64' });
    const workbook = XLSX.read(docString, { type: 'base64' });
    const yearNames = workbook.SheetNames.filter((value) =>
      value.includes('курс'),
    );
    const years: YearOfEducation[] = yearNames
      .map((year) => ({
        year,
        sheet: XLSX.utils.sheet_to_json<SheetRowObject>(workbook.Sheets[year]),
      }))
      .map<YearOfEducation>(({ year, sheet }) => ({
        groups: getGroupsFromSheet(sheet).map<Group>((group) => ({
          group: convertSheetToSchedule(sheet, group),
        })),
        yearName: year,
      }));
    set({ years });
  },
}));

export function convertSheetToSchedule(
  sheet: SheetRowObject[],
  chosenGroup: string,
): Lesson[] {
  const KEYS_TO_FOUND = ['Дни', 'Время', chosenGroup];
  const foundKeys: { [k: string]: keyof SheetRowObject } = {};
  sheet.forEach((row) => {
    let addNext = false;
    let key: keyof typeof row;
    for (key in row) {
      const element = row[key];
      if (typeof element === 'number') {
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
    .map((value) => value.map((x) => x!.toString()))
    .map((value) => ({
      day: value[0],
      time: value[1],
      name: value[2],
      place: value[3],
    }));
}

export function getGroupsFromSheet(sheet: SheetRowObject[]): string[] {
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
