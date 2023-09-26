import { SheetRowObject } from '../components/Sheet';

export function convertSheetToSchedule(
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
    .map((value) => value.map((x) => x!.toString()));
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
