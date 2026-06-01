import { useState, useEffect, useCallback } from 'react';
import * as Speech from 'expo-speech';

// Darmowy, offline TTS oparty o expo-speech (natywne AVSpeechSynthesizer na iOS /
// TextToSpeech na Androidzie). Czyta dowolny tekst po polsku – bez kluczy API.
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  // Zatrzymaj lektora gdy ekran/komponent znika.
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, opts?: { onDone?: () => void }) => {
      const clean = (text || '').trim();
      if (!clean) return;
      // Zawsze zatrzymaj poprzednią wypowiedź, żeby nie nakładały się dwie.
      Speech.stop();
      setSpeaking(true);
      Speech.speak(clean, {
        language: 'pl-PL',
        rate: 0.95,
        pitch: 1.0,
        onDone: () => {
          setSpeaking(false);
          opts?.onDone?.();
        },
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false)
      });
    },
    []
  );

  // Wygodny przełącznik dla jednego przycisku: gra → zatrzymaj, cisza → mów.
  const toggle = useCallback(
    (text: string) => {
      if (speaking) {
        stop();
      } else {
        speak(text);
      }
    },
    [speaking, stop, speak]
  );

  return { speaking, speak, stop, toggle };
}
