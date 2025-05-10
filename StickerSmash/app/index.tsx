import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, Text, View, StyleSheet, TextInput } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Index() {
  const [extractedText, setExtractedText] = useState('');
  const [aiStyle, setAiStyle] = useState("zwięźle streść poniższy tekst po polsku");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Camera access is needed to take photos.");
      }
    })();
  }, []);

  const handleButtonClicked = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.3,
      base64: true,
    });

    if (result.canceled) return;

    let rawText = '';
    setIsLoading(true);

    try {
      const response = await fetch('http://192.168.10.103:3000/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image: result.assets[0].base64,
        }),
      });

      const data = await response.json();

      rawText = data.extractedText;
    } catch (error: any) {
      console.log('Error:', error.message);
      return;
    }

    try {
      const response = await fetch('http://192.168.10.103:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "mwiewior/bielik",
          system: aiStyle,
          prompt: rawText,
          stream: false
        }),
      });

      const data = await response.json();

      setExtractedText(data.response);
    } catch (error: any) {
      console.log('Error:', error.message);
      return;
    }

    setIsLoading(false);
  }

  const onChangeText = (value: string) => {
    setAiStyle(value);
  }

  return (
    <SafeAreaProvider>
      {isLoading ?
        <ActivityIndicator style={styles.progressSpinner} />
        :
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TextInput
            style={styles.input}
            onChangeText={onChangeText}
            value={aiStyle}
          />
          <Button title="take a photo" onPress={handleButtonClicked}></Button>
          <Text>Skrócony tekst:</Text>
          <Text>{extractedText}</Text>
        </View>
      }
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  progressSpinner: {
    flex: 1,
  },
  input: {
    height: 40,
    margin: 12,
    width: '100%',
    borderWidth: 1,
    padding: 10,
  },
});
