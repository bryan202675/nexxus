import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, Keyboard, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

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

  useEffect(() => {
    const kbdShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        keyboardOffset.value = withTiming(-80, {
          duration: 250,
          easing: Easing.out(Easing.ease),
        });
      }
    );
    const kbdHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        keyboardOffset.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.ease),
        });
      }
    );
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

  return (
    <View style={styles.root}>
      <Text style={[styles.title, { color: textColor }]}>
        ¿Quieres añadir algo?
      </Text>
      <Text style={[styles.subtitle, { color: softTextColor }]}>
        Tu opinión es opcional y ayuda a dar contexto a tu pulso.
      </Text>

      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        <View style={styles.notePreviewContainer} pointerEvents="none">
          <View style={styles.noteCard}>
            <View style={styles.noteIcon}>
              <Feather name="message-circle" size={22} color="#FFFFFF" />
            </View>
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
        </View>

        <View
          style={[
            styles.inputWrap,
            dark ? styles.inputWrapDark : styles.inputWrapLight,
          ]}
        >
          <TextInput
            value={value}
            onChangeText={onChange}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center" },
  content: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    textAlign: "center",
    marginTop: 22,
  },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8 },
  notePreviewContainer: {
    width: "100%",
    marginTop: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  noteCard: {
    width: 238,
    minHeight: 92,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    shadowColor: "#312E81",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  noteIcon: {
    position: "absolute",
    top: -13,
    left: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCopy: { 
    position: "absolute",
    top: 15,
    left: 18,
    right: 18,
    paddingTop: 11 
  },
  emptyTitle: { color: "#241B3B", fontSize: 15, fontWeight: "800" },
  cursorRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  emptyHint: { color: "#766D88", fontSize: 12 },
  cursor: {
    width: 2,
    height: 13,
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
    paddingTop: 15 
  },
  line: { height: 7, borderRadius: 5, backgroundColor: "#DDD6FE" },
  lineWide: { width: "86%" },
  lineMedium: { width: "67%" },
  lineShort: { width: "44%" },
  inputWrap: {
    width: "100%",
    minHeight: 128,
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 9,
  },
  inputWrapDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.15)",
  },
  inputWrapLight: { backgroundColor: "#FFFFFF", borderColor: "#DDD6FE" },
  input: { flex: 1, fontSize: 15, lineHeight: 21, textAlignVertical: "top" },
  counter: {
    alignSelf: "flex-end",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
  },
  clear: { fontSize: 12, fontWeight: "700", marginTop: 11 },
});
