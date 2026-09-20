import React, { useMemo, useState } from 'react';
import { FlatList, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { SOMBRAS } from '@/shared/constants/diseno';

type PulseColors = ReturnType<typeof useTemaMobile>['colores']['pulso'];

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;
const isIOS = Platform.OS === 'ios';

type Categoria = 'todo' | 'tareas' | 'documentos' | 'mensajes' | 'solicitudes';

type Resultado = {
  id: string;
  title: string;
  detail: string;
  kind: Exclude<Categoria, 'todo'>;
  route: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  toneLight: string;
  toneDark: string;
};

interface Props {
  navigation: { goBack: () => void; navigate: (route: string) => void };
}

const meta: Record<
  Exclude<Categoria, 'todo'>,
  {
    label: string;
    icon: React.ComponentProps<typeof Feather>['name'];
    toneLight: string;
    toneDark: string;
  }
> = {
  tareas: {
    label: 'Tareas',
    icon: 'check-square',
    toneLight: '#EAE4F2',
    toneDark: 'rgba(168, 85, 247, 0.18)',
  },
  documentos: {
    label: 'Documentos',
    icon: 'file-text',
    toneLight: '#E3F0E8',
    toneDark: 'rgba(34, 197, 94, 0.18)',
  },
  mensajes: {
    label: 'Mensajes',
    icon: 'message-circle',
    toneLight: '#F2EBDD',
    toneDark: 'rgba(234, 179, 8, 0.18)',
  },
  solicitudes: {
    label: 'Solicitudes',
    icon: 'calendar',
    toneLight: '#F4E4DD',
    toneDark: 'rgba(239, 68, 68, 0.18)',
  },
};

export default function BusquedaGlobal({ navigation }: Props) {
  const { t } = useTranslation();
  const { tareas, documentos, solicitudesInternas, solicitudes, inboxItems } =
    useContextoUsuario();
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createSearchStyles(pulse, esOscuro), [pulse, esOscuro]);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Categoria>('todo');

  const counts = {
    tareas: tareas.length,
    documentos: documentos.length,
    mensajes: inboxItems.length,
    solicitudes: solicitudesInternas.length + (solicitudes?.length || 0),
  };

  const results = useMemo<Resultado[]>(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const list: Resultado[] = [];
    const allow = (kind: Exclude<Categoria, 'todo'>) =>
      category === 'todo' || category === kind;

    if (allow('tareas')) {
      tareas
        .filter((x) =>
          `${x.titulo} ${x.descripcion || ''}`.toLowerCase().includes(term)
        )
        .forEach((x) =>
          list.push({
            id: `task-${x.id}`,
            title: x.titulo,
            detail: `${x.estado || 'Pendiente'} · ${x.prioridad || 'Normal'}`,
            kind: 'tareas',
            route: 'CentroTareas',
            ...meta.tareas,
          })
        );
    }
    if (allow('documentos')) {
      documentos
        .filter((x) =>
          `${x.titulo} ${x.tipo} ${x.categoria || ''}`
            .toLowerCase()
            .includes(term)
        )
        .forEach((x) =>
          list.push({
            id: `doc-${x.id}`,
            title: x.titulo,
            detail: `${x.tipo} · ${x.leido ? 'Leído' : 'Pendiente'}`,
            kind: 'documentos',
            route: 'CentroDocumentos',
            ...meta.documentos,
          })
        );
    }
    if (allow('mensajes')) {
      inboxItems
        .filter((x) =>
          `${x.titulo} ${x.mensaje}`.toLowerCase().includes(term)
        )
        .forEach((x) =>
          list.push({
            id: `message-${x.id}`,
            title: x.titulo,
            detail: x.mensaje || 'Mensaje',
            kind: 'mensajes',
            route: 'BandejaUnificada',
            ...meta.mensajes,
          })
        );
    }
    if (allow('solicitudes')) {
      solicitudesInternas
        .filter((x) =>
          `${x.titulo} ${x.descripcion || ''} ${x.tipo}`
            .toLowerCase()
            .includes(term)
        )
        .forEach((x) =>
          list.push({
            id: `request-${x.id}`,
            title: x.titulo,
            detail: `${x.tipo} · ${x.estado}`,
            kind: 'solicitudes',
            route: 'SolicitudesInternas',
            ...meta.solicitudes,
          })
        );
      solicitudes
        ?.filter((x) =>
          `${x.tipo} ${x.motivo || ''}`.toLowerCase().includes(term)
        )
        .forEach((x) =>
          list.push({
            id: `absence-${x.id}`,
            title: `Ausencia: ${x.tipo}`,
            detail: `${x.estado} · ${x.fecha_inicio}`,
            kind: 'solicitudes',
            route: 'SolicitudesAusencia',
            ...meta.solicitudes,
          })
        );
    }
    return list;
  }, [category, documentos, inboxItems, query, solicitudes, solicitudesInternas, tareas]);

  const groups = useMemo(
    () =>
      (Object.keys(meta) as Exclude<Categoria, 'todo'>[]).flatMap((kind) => {
        const entries = results.filter((item) => item.kind === kind);
        return entries.length
          ? [
              { id: `heading-${kind}`, type: 'heading' as const, kind },
              ...entries.map((entry) => ({ ...entry, type: 'result' as const })),
            ]
          : [];
      }),
    [results]
  );

  const categories: { id: Categoria; label: string }[] = [
    { id: 'todo', label: 'Todo' },
    ...Object.entries(meta).map(([id, value]) => ({
      id: id as Categoria,
      label: value.label,
    })),
  ];

  const suggestions = ['Urgentes', 'Contratos', 'Pendientes', 'Vacaciones'];

  const render = ({
    item,
    index,
  }: {
    item: (typeof groups)[number];
    index: number;
  }) => {
    if (item.type === 'heading') {
      return (
        <Text style={styles.resultHeading}>
          {meta[item.kind].label}
        </Text>
      );
    }
    return (
      <Animated.View
        entering={FadeInDown.duration(180)
          .delay(Math.min(index, 7) * 22)
          .easing(Easing.out(Easing.cubic))}
      >
        <BotonAnimado
          style={styles.result}
          scaleTo={0.98}
          onPress={() => navigation.navigate(item.route)}
        >
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: esOscuro ? item.toneDark : item.toneLight },
            ]}
          >
            <Feather
              name={item.icon}
              size={isIOS ? 20 : 17}
              color={esOscuro ? pulse.text : '#554C46'}
            />
          </View>
          <View style={styles.resultCopy}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.resultDetail} numberOfLines={1}>
              {item.detail}
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={isIOS ? 19 : 17}
            color={pulse.textTertiary}
          />
        </BotonAnimado>
      </Animated.View>
    );
  };

  const exploring = !query.trim();

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar
        barStyle={esOscuro ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        pointerEvents="none"
        colors={pulse.ambient}
        locations={[0, 0.28, 0.72]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.searchHeader}>
        <BotonAnimado
          style={styles.back}
          scaleTo={0.96}
          onPress={navigation.goBack}
        >
          <Feather
            name="arrow-left"
            size={isIOS ? 20 : 18}
            color={pulse.icon}
          />
        </BotonAnimado>
        <View style={styles.field}>
          <Feather
            name="search"
            size={isIOS ? 20 : 17}
            color={pulse.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Buscar en Nexxus..."
            placeholderTextColor={pulse.textTertiary}
            keyboardAppearance={esOscuro ? 'dark' : 'light'}
          />
          {query ? (
            <BotonAnimado scaleTo={0.9} onPress={() => setQuery('')}>
              <Feather
                name="x"
                size={isIOS ? 18 : 16}
                color={pulse.icon}
              />
            </BotonAnimado>
          ) : null}
        </View>
      </View>

      <View style={styles.categoryRow}>
        {categories.map((item) => {
          const active = category === item.id;
          return (
            <BotonAnimado
              key={item.id}
              style={[
                styles.category,
                active && styles.categoryActive,
              ]}
              scaleTo={0.98}
              onPress={() => setCategory(item.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  active && styles.categoryTextActive,
                ]}
              >
                {item.label}
              </Text>
            </BotonAnimado>
          );
        })}
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={render}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          exploring ? (
            <Animated.View
              entering={FadeInDown.duration(220).easing(
                Easing.out(Easing.cubic)
              )}
            >
              <Text style={styles.caption}>
                Busca en todo tu espacio de trabajo.
              </Text>
              <View style={styles.explore}>
                <View style={styles.exploreIcon}>
                  <Feather
                    name="compass"
                    size={isIOS ? 22 : 20}
                    color={pulse.icon}
                  />
                </View>
                <Text style={styles.exploreTitle}>
                  Explora tu información
                </Text>
                <Text style={styles.exploreSub}>
                  Salta directamente al lugar que necesitas.
                </Text>
                <View style={styles.shortcutList}>
                  {(Object.keys(meta) as Exclude<Categoria, 'todo'>[]).map(
                    (kind) => (
                      <BotonAnimado
                        key={kind}
                        style={styles.shortcut}
                        scaleTo={0.98}
                        onPress={() => setCategory(kind)}
                      >
                        <View
                          style={[
                            styles.shortcutIcon,
                            {
                              backgroundColor: esOscuro
                                ? meta[kind].toneDark
                                : meta[kind].toneLight,
                            },
                          ]}
                        >
                          <Feather
                            name={meta[kind].icon}
                            size={isIOS ? 17 : 15}
                            color={esOscuro ? pulse.text : '#554C46'}
                          />
                        </View>
                        <Text style={styles.shortcutLabel}>
                          {meta[kind].label}
                        </Text>
                        <Text style={styles.shortcutCount}>
                          {counts[kind]} elementos
                        </Text>
                        <Feather
                          name="arrow-up-right"
                          size={isIOS ? 16 : 14}
                          color={pulse.textTertiary}
                        />
                      </BotonAnimado>
                    )
                  )}
                </View>
              </View>

              <Text style={styles.suggestionTitle}>
                Búsquedas frecuentes
              </Text>
              <View style={styles.suggestions}>
                {suggestions.map((item) => (
                  <BotonAnimado
                    key={item}
                    style={styles.suggestion}
                    scaleTo={0.98}
                    onPress={() => setQuery(item.toLowerCase())}
                  >
                    <Text style={styles.suggestionText}>{item}</Text>
                  </BotonAnimado>
                ))}
              </View>
            </Animated.View>
          ) : (
            <View style={styles.queryHeader}>
              <Text style={styles.caption}>
                Resultados para “{query}”
              </Text>
              <Text style={styles.count}>
                {results.length} coincidencias
              </Text>
            </View>
          )
        }
        ListEmptyComponent={
          !exploring ? (
            <View style={styles.noResults}>
              <Feather
                name="search"
                size={22}
                color={pulse.textTertiary}
              />
              <Text style={styles.noResultsTitle}>
                No encontramos resultados
              </Text>
              <Text style={styles.noResultsSub}>
                Prueba con otras palabras o cambia los filtros.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function createSearchStyles(pulse: PulseColors, esOscuro: boolean) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: pulse.background,
    },
    searchHeader: {
      flexDirection: 'row',
      gap: 9,
      paddingHorizontal: 21,
      paddingTop: 10,
      alignItems: 'center',
    },
    back: {
      width: isIOS ? 47 : 40,
      height: isIOS ? 47 : 40,
      borderRadius: isIOS ? 24 : 20,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },
    field: {
      flex: 1,
      height: isIOS ? 48 : 42,
      borderRadius: isIOS ? 24 : 21,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      paddingHorizontal: isIOS ? 15 : 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: isIOS ? 10 : 8,
      ...SOMBRAS.suave,
    },
    input: {
      flex: 1,
      color: pulse.text,
      fontSize: isIOS ? 15 : 13.5,
      fontWeight: '600',
    },
    categoryRow: {
      flexDirection: 'row',
      gap: isIOS ? 8 : 7,
      paddingHorizontal: 21,
      paddingTop: isIOS ? 12 : 10,
      paddingBottom: 2,
    },
    category: {
      height: isIOS ? 37 : 33,
      borderRadius: isIOS ? 19 : 17,
      paddingHorizontal: isIOS ? 14 : 12,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryActive: {
      backgroundColor: pulse.chipActive,
      borderColor: pulse.chipActive,
    },
    categoryText: {
      color: pulse.textTertiary,
      fontSize: isIOS ? 13 : 11,
      fontWeight: '700',
    },
    categoryTextActive: {
      color: pulse.textInverse,
    },
    content: {
      paddingHorizontal: 21,
      paddingBottom: isIOS ? 80 : 60,
    },
    caption: {
      color: pulse.textTertiary,
      fontSize: isIOS ? 13 : 12,
      marginTop: 12,
    },
    explore: {
      marginTop: 14,
      borderRadius: isIOS ? 27 : 20,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      padding: isIOS ? 18 : 15,
      ...SOMBRAS.suave,
    },
    exploreIcon: {
      width: isIOS ? 42 : 36,
      height: isIOS ? 42 : 36,
      borderRadius: isIOS ? 21 : 18,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exploreTitle: {
      color: pulse.text,
      fontSize: isIOS ? 21 : 18,
      fontWeight: '700',
      letterSpacing: -0.4,
      marginTop: 10,
    },
    exploreSub: {
      color: pulse.textTertiary,
      fontSize: isIOS ? 13 : 11.5,
      marginTop: 3,
    },
    shortcutList: {
      marginTop: 12,
    },
    shortcut: {
      minHeight: isIOS ? 53 : 46,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    shortcutIcon: {
      width: isIOS ? 34 : 28,
      height: isIOS ? 34 : 28,
      borderRadius: isIOS ? 17 : 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shortcutLabel: {
      color: pulse.text,
      fontSize: isIOS ? 14 : 12,
      fontWeight: '700',
      flex: 1,
    },
    shortcutCount: {
      color: pulse.textTertiary,
      fontSize: isIOS ? 12 : 10,
      fontWeight: '600',
    },
    suggestionTitle: {
      color: pulse.textTertiary,
      fontSize: isIOS ? 17 : 15,
      fontWeight: '600',
      marginTop: 20,
      marginBottom: 8,
    },
    suggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    suggestion: {
      height: isIOS ? 34 : 30,
      borderRadius: isIOS ? 17 : 15,
      paddingHorizontal: isIOS ? 13 : 11,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    suggestionText: {
      color: pulse.text,
      fontSize: isIOS ? 12.5 : 11,
      fontWeight: '700',
    },
    queryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    count: {
      color: pulse.textTertiary,
      fontSize: isIOS ? 12 : 10.5,
      marginTop: 12,
    },
    resultHeading: {
      color: pulse.textTertiary,
      fontSize: isIOS ? 17 : 15,
      fontWeight: '600',
      marginTop: 18,
      marginBottom: 4,
    },
    result: {
      minHeight: isIOS ? 68 : 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 16,
      paddingHorizontal: isIOS ? 14 : 12,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      marginTop: 6,
      ...SOMBRAS.suave,
    },
    resultIcon: {
      width: isIOS ? 42 : 32,
      height: isIOS ? 42 : 32,
      borderRadius: isIOS ? 21 : 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultCopy: {
      flex: 1,
      minWidth: 0,
    },
    resultTitle: {
      color: pulse.text,
      fontSize: isIOS ? 14 : 12.5,
      fontWeight: '700',
    },
    resultDetail: {
      color: pulse.textTertiary,
      fontSize: isIOS ? 12 : 10,
      marginTop: 2,
    },
    noResults: {
      alignItems: 'center',
      paddingTop: 40,
    },
    noResultsTitle: {
      color: pulse.text,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 10,
    },
    noResultsSub: {
      color: pulse.textTertiary,
      fontSize: 11.5,
      marginTop: 3,
      textAlign: 'center',
    },
  });
}
