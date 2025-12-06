import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isLoading?: boolean;
}

interface GeminiChatModalProps {
  visible: boolean;
  attractionTitle: string;
  attractionDescription: string;
  attractionLocation: string;
  onClose: () => void;
}

// Przykładowe pytania dla różnych miejsc
const getSuggestedQuestions = (title: string): string[] => {
  const questions = [
    `Kiedy powstał ${title}?`,
    `Opowiedz ciekawostki o tym miejscu`,
    `Kto zaprojektował ten obiekt?`,
    `Co warto zobaczyć w pobliżu?`
  ];
  return questions;
};

export default function GeminiChatModal({
  visible,
  attractionTitle,
  attractionDescription,
  attractionLocation,
  onClose
}: GeminiChatModalProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const slideAnim = useRef(new Animated.Value(500)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const suggestedQuestions = getSuggestedQuestions(attractionTitle);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMessages([]);
      setInputText('');

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      onClose();
    });
  };

  // Znacznie bardziej liberalna walidacja - blokuje tylko oczywiste off-topic
  const isOffTopic = (question: string): boolean => {
    const lowerQuestion = question.toLowerCase().trim();

    // Lista tematów, które NA PEWNO nie są związane z turystyką
    const offTopicPatterns = [
      /napisz (mi )?(kod|program|skrypt)/,
      /jak (napisać|zrobić|stworzyć) (aplikację|stronę|program)/,
      /przepis na/,
      /jak ugotować/,
      /ile to jest \d+/,
      /rozwiąż (równanie|zadanie matematyczne)/,
      /przetłumacz (na|z) (angielski|niemiecki|francuski)/,
      /napisz (esej|wypracowanie|list)/,
      /jaka jest (pogoda|temperatura) (w|na)/,
      /kto wygrał (mecz|wybory)/,
      /jak schudnąć/,
      /jak zarobić pieniądze/,
      /opowiedz (żart|dowcip)/,
      /zaśpiewaj/,
      /napisz wiersz o miłości/
    ];

    for (const pattern of offTopicPatterns) {
      if (pattern.test(lowerQuestion)) {
        return true;
      }
    }

    return false;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Sprawdź czy pytanie jest ewidentnie off-topic
    if (isOffTopic(text)) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `🎯 Jestem przewodnikiem po "${attractionTitle}". Chętnie opowiem o tym miejscu, jego historii, architekturze lub okolicy. Zadaj pytanie związane z tą atrakcją!`,
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      return;
    }

    // Dodaj placeholder dla odpowiedzi
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: '',
      isUser: false,
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Sprawdź czy API key jest dostępny
      if (!GEMINI_API_KEY) {
        throw new Error('Brak klucza API');
      }

      const systemPrompt = `Jesteś ekspertem i przewodnikiem turystycznym po Bydgoszczy. Aktualnie opowiadasz o miejscu: "${attractionTitle}".

Kontekst miejsca:
- Nazwa: ${attractionTitle}
- Lokalizacja: ${attractionLocation}
- Opis: ${attractionDescription}

WAŻNE ZASADY:
1. Odpowiadaj TYLKO po polsku
2. Odpowiadaj zwięźle (2-4 zdania), ale merytorycznie
3. Bądź przyjazny i entuzjastyczny jak prawdziwy przewodnik
4. Jeśli pytanie dotyczy czegoś niezwiązanego z tym miejscem lub Bydgoszczą, grzecznie przekieruj rozmowę na temat atrakcji
5. Możesz dodać ciekawostki związane z miejscem
6. Jeśli nie znasz dokładnej odpowiedzi, powiedz co wiesz i zasugeruj gdzie można znaleźć więcej informacji`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `Pytanie turysty: ${text}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
          topP: 0.8,
          topK: 40
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      console.log('Sending request to Gemini API...');
      console.log('API Key exists:', !!GEMINI_API_KEY);
      console.log('API Key first 10 chars:', GEMINI_API_KEY?.substring(0, 10));

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      let aiResponse = '';

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        aiResponse = data.candidates[0].content.parts[0].text;
      } else if (data.promptFeedback?.blockReason) {
        aiResponse =
          'Przepraszam, nie mogę odpowiedzieć na to pytanie. Spróbuj zapytać o coś innego związanego z tym miejscem.';
      } else {
        console.error('Unexpected response structure:', data);
        throw new Error('Nieoczekiwana struktura odpowiedzi');
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.isLoading ? { ...msg, text: aiResponse, isLoading: false } : msg
        )
      );
    } catch (error: any) {
      console.error('Gemini API error:', error);

      let errorText = 'Wystąpił błąd. Spróbuj ponownie za chwilę.';

      if (error.message?.includes('API key')) {
        errorText = 'Problem z konfiguracją. Sprawdź klucz API.';
      } else if (error.message?.includes('quota')) {
        errorText = 'Przekroczono limit zapytań. Spróbuj za chwilę.';
      } else if (
        error.message?.includes('network') ||
        error.message?.includes('fetch')
      ) {
        errorText =
          'Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.';
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.isLoading ? { ...msg, text: errorText, isLoading: false } : msg
        )
      );
    }

    setIsLoading(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleClose}
          />

          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <BlurView intensity={95} tint="dark" style={styles.blurContainer}>
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerInfo}>
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={16} color="#1B4D3E" />
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerLabel}>Przewodnik AI</Text>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                      {attractionTitle}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color="rgba(255,255,255,0.7)"
                  />
                </TouchableOpacity>
              </View>

              {/* Chat area */}
              <View
                style={[
                  styles.chatContainer,
                  isKeyboardVisible && styles.chatContainerKeyboard
                ]}
              >
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesContainer}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onContentSizeChange={() =>
                    scrollViewRef.current?.scrollToEnd({ animated: true })
                  }
                >
                  {messages.length === 0 ? (
                    <View style={styles.emptyState}>
                      {!isKeyboardVisible && (
                        <>
                          <View style={styles.emptyIconContainer}>
                            <Ionicons
                              name="chatbubbles-outline"
                              size={32}
                              color="#4ADE80"
                            />
                          </View>
                          <Text style={styles.emptyTitle}>Witaj! 👋</Text>
                          <Text style={styles.emptySubtitle}>
                            Jestem Twoim przewodnikiem po {attractionTitle}.
                            Zapytaj mnie o cokolwiek!
                          </Text>

                          {/* Suggested questions - ukryte gdy klawiatura widoczna */}
                          <View style={styles.suggestionsContainer}>
                            {suggestedQuestions.map((question, index) => (
                              <TouchableOpacity
                                key={index}
                                style={styles.suggestionButton}
                                onPress={() =>
                                  handleSuggestedQuestion(question)
                                }
                              >
                                <Ionicons
                                  name="chatbubble-outline"
                                  size={14}
                                  color="#4ADE80"
                                />
                                <Text
                                  style={styles.suggestionText}
                                  numberOfLines={2}
                                >
                                  {question}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </>
                      )}
                      {isKeyboardVisible && (
                        <View style={styles.keyboardHint}>
                          <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={24}
                            color="rgba(255,255,255,0.4)"
                          />
                          <Text style={styles.keyboardHintText}>
                            Wpisz pytanie o {attractionTitle}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <>
                      {messages.map(message => (
                        <View
                          key={message.id}
                          style={[
                            styles.messageBubble,
                            message.isUser ? styles.userBubble : styles.aiBubble
                          ]}
                        >
                          {!message.isUser && (
                            <View style={styles.aiAvatar}>
                              <Ionicons
                                name="sparkles"
                                size={12}
                                color="#1B4D3E"
                              />
                            </View>
                          )}
                          <View
                            style={[
                              styles.messageContent,
                              message.isUser
                                ? styles.userContent
                                : styles.aiContent
                            ]}
                          >
                            {message.isLoading ? (
                              <View style={styles.loadingDots}>
                                <ActivityIndicator
                                  size="small"
                                  color="#4ADE80"
                                />
                                <Text style={styles.loadingText}>Myślę...</Text>
                              </View>
                            ) : (
                              <Text
                                style={[
                                  styles.messageText,
                                  message.isUser
                                    ? styles.userText
                                    : styles.aiText
                                ]}
                              >
                                {message.text}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}

                      {/* Quick suggestions - ukryte gdy klawiatura widoczna */}
                      {messages.length > 0 &&
                        messages.length < 6 &&
                        !isLoading &&
                        !isKeyboardVisible && (
                          <View style={styles.quickSuggestions}>
                            <Text style={styles.quickSuggestionsLabel}>
                              Zapytaj też:
                            </Text>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                            >
                              {suggestedQuestions
                                .slice(0, 3)
                                .map((question, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    style={styles.quickSuggestionChip}
                                    onPress={() =>
                                      handleSuggestedQuestion(question)
                                    }
                                  >
                                    <Text
                                      style={styles.quickSuggestionText}
                                      numberOfLines={1}
                                    >
                                      {question}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                            </ScrollView>
                          </View>
                        )}
                    </>
                  )}
                </ScrollView>

                {/* Input area */}
                <View
                  style={[
                    styles.inputContainer,
                    { paddingBottom: insets.bottom > 0 ? 8 : 16 }
                  ]}
                >
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Zapytaj o to miejsce..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={inputText}
                      onChangeText={setInputText}
                      multiline
                      maxLength={500}
                      editable={!isLoading}
                      onSubmitEditing={() => sendMessage(inputText)}
                      blurOnSubmit={false}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        (!inputText.trim() || isLoading) &&
                          styles.sendButtonDisabled
                      ]}
                      onPress={() => sendMessage(inputText)}
                      disabled={!inputText.trim() || isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#1B4D3E" />
                      ) : (
                        <Ionicons name="send" size={18} color="#1B4D3E" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end'
  },
  overlayTouchable: {
    flex: 1
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%'
  },
  blurContainer: {
    paddingTop: 12
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  aiBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTextContainer: {
    flex: 1
  },
  headerLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginBottom: 2
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12
  },
  chatContainer: {
    height: 420
  },
  chatContainerKeyboard: {
    height: 200
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20
  },
  messagesContent: {
    paddingBottom: 16
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20
  },
  suggestionsContainer: {
    width: '100%',
    gap: 10
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)'
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500'
  },
  keyboardHint: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20
  },
  keyboardHintText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center'
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end'
  },
  userBubble: {
    justifyContent: 'flex-end'
  },
  aiBubble: {
    justifyContent: 'flex-start'
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  messageContent: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16
  },
  userContent: {
    backgroundColor: '#1B4D3E',
    borderBottomRightRadius: 4,
    marginLeft: 'auto'
  },
  aiContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  userText: {
    color: '#FFFFFF'
  },
  aiText: {
    color: '#FFFFFF'
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)'
  },
  quickSuggestions: {
    marginTop: 12,
    marginBottom: 8
  },
  quickSuggestionsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10
  },
  quickSuggestionChip: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)'
  },
  quickSuggestionText: {
    fontSize: 13,
    color: '#4ADE80',
    fontWeight: '500'
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
    paddingVertical: 8
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(74, 222, 128, 0.3)'
  }
});
