import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const isAndroid = Platform.OS === "android";

export default function NoteStep({
  value,
  onChange,
  textColor,
  softTextColor,
  dark,
}: {
  value: string;
  onChange: (value: string) => void;
  textColor: string;
  softTextColor: string;
  dark: boolean;
}) {
  const hasNote = useSharedValue(value.trim().length > 0 ? 1 : 0);
  const cursor = useSharedValue(1);

  useEffect(() => {
    hasNote.value = withTiming(value.trim().length > 0 ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [hasNote, value]);

  useEffect(() => {
    cursor.value = withRepeat(
      withTiming(0.2, { duration: 580, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [cursor]);

  const keyboardOffset = useSharedValue(0);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const isKeyboardActive = isFocused || keyboardVisible;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const kbdShow = Keyboard.addListener(showEvent, () => {
      if (isAndroid) {
        setKeyboardVisible(true);
      } else {
        keyboardOffset.value = withTiming(-80, {
          duration: 250,
          easing: Easing.out(Easing.ease),
        });
      }
    });
    const kbdHide = Keyboard.addListener(hideEvent, () => {
      if (isAndroid) {
        setKeyboardVisible(false);
        setIsFocused(false);
      } else {
        keyboardOffset.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.ease),
        });
      }
    });
    return () => {
      kbdShow.remove();
      kbdHide.remove();
    };
  }, [keyboardOffset]);

  const emptyCopyStyle = useAnimatedStyle(() => ({
    opacity: 1 - hasNote.value,
    transform: [{ translateY: interpolate(hasNote.value, [0, 1], [0, -6]) }],
  }));
  const linesStyle = useAnimatedStyle(() => ({
    opacity: hasNote.value,
    transform: [{ translateY: interpolate(hasNote.value, [0, 1], [8, 0]) }],
  }));
  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursor.value * (1 - hasNote.value),
  }));
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardOffset.value }],
  }));

  const ContentWrapper = isAndroid ? ScrollView : View;
  const wrapperProps = isAndroid
    ? {
        style: styles.scroll,
        contentContainerStyle: [
          styles.scrollContent,
          isKeyboardActive && styles.scrollContentKeyboard,
        ],
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: "handled" as const,
        bounces: false,
      }
    : { style: styles.root };

  return (
    <ContentWrapper {...(wrapperProps as any)}>
      <Text
        style={[
          styles.title,
          { color: textColor },
          isAndroid && isKeyboardActive && styles.titleKeyboard,
        ]}
      >
        ¿Quieres añadir algo?
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: softTextColor },
          isAndroid && isKeyboardActive && styles.subtitleKeyboard,
        ]}
      >
        Tu opinión es opcional y ayuda a dar contexto a tu pulso.
      </Text>

      <Animated.View
        style={[
          styles.content,
          isAndroid && isKeyboardActive && styles.contentKeyboard,
          contentAnimatedStyle,
        ]}
      >
        {(!isAndroid || !isKeyboardActive) && (
          <View style={styles.notePreviewContainer} pointerEvents="none">
            <View style={styles.noteCardWrapper}>
              <View style={styles.noteCard}>
                <Animated.View style={[styles.emptyCopy, emptyCopyStyle]}>
                  <Text style={styles.emptyTitle}>Una frase es suficiente</Text>
                  <View style={styles.cursorRow}>
                    <Text style={styles.emptyHint}>Cuéntanos cómo va tu día</Text>
                    <Animated.View style={[styles.cursor, cursorStyle]} />
                  </View>
                </Animated.View>
                <Animated.View style={[styles.lines, linesStyle]}>
                  <View style={[styles.line, styles.lineWide]} />
                  <View style={[styles.line, styles.lineMedium]} />
                  <View style={[styles.line, styles.lineShort]} />
                </Animated.View>
              </View>
              <View style={styles.noteIcon}>
                <Feather
                  name="message-circle"
                  size={isAndroid ? 18 : 22}
                  color="#FFFFFF"
                />
              </View>
            </View>
          </View>
        )}

        <View
          style={[
            styles.inputWrap,
            dark ? styles.inputWrapDark : styles.inputWrapLight,
            isAndroid && isKeyboardActive && styles.inputWrapKeyboard,
          ]}
        >
          <TextInput
            value={value}
            onChangeText={onChange}
            onFocus={() => {
              setIsFocused(true);
              if (isAndroid) setKeyboardVisible(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              if (isAndroid) setKeyboardVisible(false);
            }}
            placeholder="Comparte algo sobre tu jornada..."
            placeholderTextColor={softTextColor}
            multiline
            blurOnSubmit={true}
            onSubmitEditing={() => Keyboard.dismiss()}
            maxLength={500}
            style={[styles.input, { color: textColor }]}
            accessibilityLabel="Opinión opcional"
          />
          <Text style={[styles.counter, { color: softTextColor }]}>
            {value.length}/500
          </Text>
        </View>
        {value.length > 0 && (
          <Pressable
            onPress={() => onChange("")}
            accessibilityRole="button"
            accessibilityLabel="Borrar opinión"
          >
            <Text style={[styles.clear, { color: softTextColor }]}>
              Borrar nota
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </ContentWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center" },
  scroll: { flex: 1, width: "100%" },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 14,
  },
  scrollContentKeyboard: {
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  content: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: isAndroid ? 14 : 60,
  },
  contentKeyboard: {
    justifyContent: "flex-start",
    paddingTop: 4,
    flex: 0,
  },
  title: {
    fontSize: isAndroid ? 23 : 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    textAlign: "center",
    marginTop: isAndroid ? 10 : 22,
  },
  titleKeyboard: {
    fontSize: 20,
    marginTop: 4,
  },
  subtitle: {
    fontSize: isAndroid ? 12 : 14,
    lineHeight: isAndroid ? 18 : 20,
    textAlign: "center",
    marginTop: isAndroid ? 4 : 8,
  },
  subtitleKeyboard: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  notePreviewContainer: {
    width: "100%",
    marginTop: isAndroid ? 12 : 24,
    justifyContent: "center",
    alignItems: "center",
  },
  noteCardWrapper: {
    width: isAndroid ? "86%" : 238,
    maxWidth: isAndroid ? 280 : 238,
    paddingTop: isAndroid ? 17 : 0,
    position: "relative",
    alignItems: "center",
  },
  noteCard: {
    width: "100%",
    minHeight: isAndroid ? 92 : 92,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: isAndroid ? 14 : 15,
    backgroundColor: "#FFFFFF",
    shadowColor: "#312E81",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
    overflow: "visible",
  },
  noteIcon: {
    position: "absolute",
    top: isAndroid ? 0 : -13,
    left: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 6,
  },
  emptyCopy: { 
    position: "absolute",
    top: isAndroid ? 16 : 15,
    left: 18,
    right: 18,
    paddingTop: isAndroid ? 4 : 11,
  },
  emptyTitle: {
    color: "#241B3B",
    fontSize: isAndroid ? 14 : 15,
    fontWeight: "800",
  },
  cursorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: isAndroid ? 3 : 4,
  },
  emptyHint: {
    color: "#766D88",
    fontSize: isAndroid ? 12 : 12,
  },
  cursor: {
    width: 2,
    height: isAndroid ? 12 : 13,
    marginLeft: 4,
    borderRadius: 1,
    backgroundColor: "#7C3AED",
  },
  lines: { 
    position: "absolute",
    top: 15,
    left: 18,
    right: 18,
    gap: 8, 
    paddingTop: 14,
  },
  line: { height: 7, borderRadius: 5, backgroundColor: "#DDD6FE" },
  lineWide: { width: "86%" },
  lineMedium: { width: "67%" },
  lineShort: { width: "44%" },
  inputWrap: {
    width: "100%",
    minHeight: isAndroid ? 114 : 128,
    marginTop: isAndroid ? 14 : 18,
    borderRadius: isAndroid ? 18 : 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: isAndroid ? 10 : 12,
    paddingBottom: isAndroid ? 8 : 9,
  },
  inputWrapKeyboard: {
    marginTop: 8,
    minHeight: 108,
  },
  inputWrapDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.15)",
  },
  inputWrapLight: { backgroundColor: "#FFFFFF", borderColor: "#DDD6FE" },
  input: {
    flex: 1,
    fontSize: isAndroid ? 14 : 15,
    lineHeight: isAndroid ? undefined : 21,
    textAlignVertical: "top",
    paddingTop: isAndroid ? 2 : 0,
    paddingBottom: isAndroid ? 2 : 0,
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: isAndroid ? 10 : 11,
    fontWeight: "700",
    marginTop: isAndroid ? 4 : 5,
  },
  clear: {
    fontSize: isAndroid ? 11 : 12,
    fontWeight: "700",
    marginTop: isAndroid ? 8 : 11,
  },
});
