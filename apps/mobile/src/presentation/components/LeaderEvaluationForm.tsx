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
  const pulse = colores.pulso;
  const styles = React.useMemo(() => crearEstilos(pulse, esOscuro), [pulse, esOscuro]);

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
        <MaterialIcons name="fact-check" size={26} color={pulse.textTertiary} />
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
        <MaterialIcons name="search" size={18} color={pulse.textTertiary} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Buscar empleado" placeholderTextColor={pulse.textTertiary} style={styles.searchInput} />
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

      <ScoreControl styles={styles} pulse={pulse} label="Puntualidad" value={puntualidad} onChange={setPuntualidad} />
      <ScoreControl styles={styles} pulse={pulse} label="Tareas" value={tareasCompletadas} onChange={setTareasCompletadas} />
      <ScoreControl styles={styles} pulse={pulse} label="Disciplina" value={disciplina} onChange={setDisciplina} />

      <TextInput
        placeholder="Agregar comentario opcional…"
        placeholderTextColor={pulse.textTertiary}
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
        <MaterialIcons name="save" size={17} color={pulse.textInverse} />
        <Text style={styles.submitText}>{saving ? 'Guardando' : 'Guardar evaluación'}</Text>
      </Pressable>
    </View>
  );
}

function ScoreControl({ styles, pulse, label, value, onChange }: { styles: any; pulse: any; label: string; value: number; onChange: (value: number) => void }) {
  const setScore = (next: number) => onChange(Math.max(0, Math.min(100, next)));
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreLabelWrap}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreValue}>{value}</Text>
      </View>
      <View style={styles.scoreActions}>
        <Pressable accessibilityRole="button" onPress={() => setScore(value - 5)} style={({ pressed }) => [styles.scoreButton, pressed && styles.scoreButtonPressed]}>
          <MaterialIcons name="remove" size={16} color={pulse.icon} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setScore(value + 5)} style={({ pressed }) => [styles.scoreButton, pressed && styles.scoreButtonPressed]}>
          <MaterialIcons name="add" size={16} color={pulse.icon} />
        </Pressable>
      </View>
    </View>
  );
}

function crearEstilos(pulse: ReturnType<typeof useTemaMobile>['colores']['pulso'], esOscuro: boolean) {
  return StyleSheet.create({
    card: {
      padding: 18,
      borderRadius: 24,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      gap: 16,
    },
    selectorLabel: { color: pulse.text, fontSize: 16, fontWeight: '600' },
    searchBox: {
      height: 46,
      paddingHorizontal: 13,
      borderRadius: 23,
      backgroundColor: pulse.pill,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    searchInput: { flex: 1, color: pulse.text, fontSize: 14 },
    peopleRow: {
      flexDirection: 'row',
      gap: 8,
    },
    personButton: {
      width: 70,
      minHeight: 78,
      borderRadius: 18,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: pulse.border,
    },
    personButtonActive: {
      borderColor: pulse.chipActive,
      backgroundColor: pulse.chipActive,
    },
    personButtonPressed: {
      opacity: 0.76,
    },
    personAvatar: { width: 32, height: 32, borderRadius: 16, marginBottom: 4 },
    personAvatarFallback: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginBottom: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    personAvatarInitial: { color: pulse.text, fontSize: 13, fontWeight: '700' },
    personText: {
      color: pulse.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    personTextActive: {
      color: pulse.chipTextActive,
      fontWeight: '700',
    },
    scoreRow: {
      minHeight: 44,
      borderRadius: 16,
      backgroundColor: pulse.pill,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: pulse.border,
    },
    scoreLabelWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    scoreLabel: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: '600',
    },
    scoreValue: {
      color: pulse.textSecondary,
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
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    scoreButtonPressed: {
      opacity: 0.2,
    },
    input: {
      minHeight: 72,
      borderRadius: 18,
      backgroundColor: pulse.pill,
      color: pulse.text,
      padding: 12,
      fontSize: 13,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: pulse.border,
    },
    submitButton: {
      minHeight: 42,
      borderRadius: 22,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    submitText: {
      color: pulse.textInverse,
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
      borderColor: pulse.border,
      backgroundColor: pulse.surfaceElevated,
      padding: 16,
    },
    emptyTitle: {
      color: pulse.text,
      fontSize: 14,
      fontWeight: '900',
    },
    emptyText: {
      color: pulse.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
  });
}
