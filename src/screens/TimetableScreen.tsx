import * as fs from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import * as XLSX from 'xlsx';

import { handleDocument } from '../Utils';
import { Sheet } from '../components/Sheet';

export function TimetableScreen() {
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
