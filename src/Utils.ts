import * as DocumentPicker from 'expo-document-picker';

export function groupBy<S, T extends keyof any>(
  sequence: S[],
  tagGetter: (item: S) => T,
): {
  [K in T]: S[];
} {
  const res = {} as {
    [K in T]: S[];
  };
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
export async function handleDocument(): Promise<DocumentPicker.DocumentPickerResult> {
  const document = await DocumentPicker.getDocumentAsync();
  return document;
}
