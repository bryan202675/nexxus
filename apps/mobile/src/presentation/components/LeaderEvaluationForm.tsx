import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LeaderTeamMember } from 'domain/entities/Leader';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

export type LeaderEvaluationPayload = {
  empleadoId: string;
  empleadoNombre: string;
  periodo: string;
  puntualidad: number;
  tareasCompletadas: number;
  disciplina: number;
  comentarios: string;
};

const PERIOD = new Date().toISOString().slice(0, 7);

export function LeaderEvaluationForm({
  team,
  saving,
  onSubmit,
}: {
  team: LeaderTeamMember[];
  saving: boolean;
  onSubmit: (payload: LeaderEvaluationPayload) => Promise<void>;
}) {
  const { colores, esOscuro } = useTemaMobile();
  const styles = React.useMemo(() => crearEstilos(colores, esOscuro), [colores, esOscuro]);

  const [employeeId, setEmployeeId] = useState(team[0]?.id || '');
  const [puntualidad, setPuntualidad] = useState(85);
  const [tareasCompletadas, setTareasCompletadas] = useState(85);
  const [disciplina, setDisciplina] = useState(85);
  const [comentarios, setComentarios] = useState('');
  const [search, setSearch] = useState('');
  const selected = useMemo(() => team.find((member) => member.id === employeeId) || team[0], [employeeId, team]);
  const selectableTeam = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? team.filter((member) => member.nombre.toLowerCase().includes(term)) : team;
  }, [search, team]);

  if (team.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialIcons name="fact-check" size={26} color={colores.textoSuave} />
        <Text style={styles.emptyTitle}>Evaluaciones sin equipo</Text>
        <Text style={styles.emptyText}>Primero asigna empleados a este jefe para registrar desempeño mensual.</Text>
      </View>
    );
  }

  const submit = async () => {
    if (!selected) return;
    await onSubmit({
      empleadoId: selected.id,
      empleadoNombre: selected.nombre,
      periodo: PERIOD,
      puntualidad,
      tareasCompletadas,
      disciplina,
      comentarios: comentarios.trim() || 'Evaluación mensual registrada desde panel de jefe.',
    });
    setComentarios('');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.selectorLabel}>Empleado</Text>
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={18} color={colores.textoSuave} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Buscar empleado" placeholderTextColor={colores.textoSuave} style={styles.searchInput} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleRow}>
        {selectableTeam.map((member) => {
          const active = selected?.id === member.id;
          return (
            <Pressable
              accessibilityRole="button"
              key={member.id}
              onPress={() => setEmployeeId(member.id)}
              style={({ pressed }) => [styles.personButton, active && styles.personButtonActive, pressed && styles.personButtonPressed]}
            >
              {member.foto_perfil ? <Image source={{ uri: member.foto_perfil }} style={styles.personAvatar} /> : <View style={styles.personAvatarFallback}><Text style={styles.personAvatarInitial}>{member.nombre.slice(0, 1).toUpperCase()}</Text></View>}
              <Text style={[styles.personText, active && styles.personTextActive]} numberOfLines={1}>{member.nombre.split(' ')[0]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScoreControl styles={styles} colores={colores} label="Puntualidad" value={puntualidad} onChange={setPuntualidad} />
      <ScoreControl styles={styles} colores={colores} label="Tareas" value={tareasCompletadas} onChange={setTareasCompletadas} />
      <ScoreControl styles={styles} colores={colores} label="Disciplina" value={disciplina} onChange={setDisciplina} />

      <TextInput
        placeholder="Agregar comentario opcional…"
        placeholderTextColor={colores.textoSuave}
        value={comentarios}
        onChangeText={setComentarios}
        style={styles.input}
        multiline
      />

      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={submit}
        style={({ pressed }) => [styles.submitButton, saving && styles.disabled, pressed && styles.submitButtonPressed]}
      >
        <MaterialIcons name="save" size={17} color="#FFFFFF" />
        <Text style={styles.submitText}>{saving ? 'Guardando' : 'Guardar evaluación'}</Text>
      </Pressable>
    </View>
  );
}

function ScoreControl({ styles, colores, label, value, onChange }: { styles: any, colores: any, label: string; value: number; onChange: (value: number) => void }) {
  const setScore = (next: number) => onChange(Math.max(0, Math.min(100, next)));
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreLabelWrap}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreValue}>{value}</Text>
      </View>
      <View style={styles.scoreActions}>
        <Pressable accessibilityRole="button" onPress={() => setScore(value - 5)} style={({ pressed }) => [styles.scoreButton, pressed && styles.scoreButtonPressed]}>
          <MaterialIcons name="remove" size={16} color={colores.textoSecundario} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setScore(value + 5)} style={({ pressed }) => [styles.scoreButton, pressed && styles.scoreButtonPressed]}>
          <MaterialIcons name="add" size={16} color={colores.textoSecundario} />
        </Pressable>
      </View>
    </View>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  return StyleSheet.create({
    card: {
      padding: 18,
      borderRadius: 24,
      backgroundColor: '#FFFFFF',
      gap: 16,
    },
    selectorLabel: { color: '#292522', fontSize: 16, fontWeight: '600' },
    searchBox: { height: 46, paddingHorizontal: 13, borderRadius: 23, backgroundColor: '#F1EFED', flexDirection: 'row', alignItems: 'center', gap: 8 },
    searchInput: { flex: 1, color: '#292522', fontSize: 14 },
    peopleRow: {
      flexDirection: 'row',
      gap: 8,
    },
    personButton: {
      width: 70,
      minHeight: 78,
      borderRadius: 18,
      backgroundColor: '#F7F4F2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    personButtonActive: {
      borderColor: '#17141B',
      backgroundColor: '#202020',
    },
    personButtonPressed: {
      opacity: 0.76,
    },
    personAvatar: { width: 32, height: 32, borderRadius: 16, marginBottom: 4 },
    personAvatarFallback: { width: 32, height: 32, borderRadius: 16, marginBottom: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9D2BF' },
    personAvatarInitial: { color: '#382E29', fontSize: 13, fontWeight: '700' },
    personText: {
      color: '#625B56',
      fontSize: 12,
      fontWeight: '600',
    },
    personTextActive: {
      color: '#FFFFFF',
    },
    scoreRow: {
      minHeight: 44,
      borderRadius: 16,
      backgroundColor: '#F7F4F2',
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    scoreLabelWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    scoreLabel: {
      color: c.texto,
      fontSize: 13,
      fontWeight: '600',
    },
    scoreValue: {
      color: c.textoSecundario,
      fontSize: 13,
      fontWeight: '600',
    },
    scoreActions: {
      flexDirection: 'row',
      gap: 8,
    },
    scoreButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    scoreButtonPressed: {
      opacity: 0.2,
    },
    input: {
      minHeight: 72,
      borderRadius: 18,
      backgroundColor: '#F7F4F2',
      color: c.texto,
      padding: 12,
      fontSize: 13,
      textAlignVertical: 'top',
    },
    submitButton: {
      minHeight: 42,
      borderRadius: 22,
      backgroundColor: '#202020',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    submitText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },
    disabled: {
      opacity: 0.55,
    },
    submitButtonPressed: {
      opacity: 0.78,
    },
    empty: {
      minHeight: 132,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      padding: 16,
    },
    emptyTitle: {
      color: c.texto,
      fontSize: 14,
      fontWeight: '900',
    },
    emptyText: {
      color: c.textoSuave,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
  });
}
