import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LeaderTeamMember } from 'domain/entities/Leader';

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
  const [employeeId, setEmployeeId] = useState(team[0]?.id || '');
  const [puntualidad, setPuntualidad] = useState(85);
  const [tareasCompletadas, setTareasCompletadas] = useState(85);
  const [disciplina, setDisciplina] = useState(85);
  const [comentarios, setComentarios] = useState('');
  const selected = useMemo(() => team.find((member) => member.id === employeeId) || team[0], [employeeId, team]);

  if (team.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialIcons name="fact-check" size={26} color="#94A3B8" />
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
      <View style={styles.peopleRow}>
        {team.slice(0, 4).map((member) => {
          const active = selected?.id === member.id;
          return (
            <Pressable
              accessibilityRole="button"
              key={member.id}
              onPress={() => setEmployeeId(member.id)}
              style={({ pressed }) => [styles.personButton, active && styles.personButtonActive, pressed && styles.personButtonPressed]}
            >
              <Text style={[styles.personText, active && styles.personTextActive]} numberOfLines={1}>{member.nombre}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScoreControl label="Puntualidad" value={puntualidad} onChange={setPuntualidad} />
      <ScoreControl label="Tareas" value={tareasCompletadas} onChange={setTareasCompletadas} />
      <ScoreControl label="Disciplina" value={disciplina} onChange={setDisciplina} />

      <TextInput
        placeholder="Comentario breve"
        placeholderTextColor="#64748B"
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
        <Text style={styles.submitText}>{saving ? 'Guardando' : `Guardar evaluación ${PERIOD}`}</Text>
      </Pressable>
    </View>
  );
}

function ScoreControl({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const setScore = (next: number) => onChange(Math.max(0, Math.min(100, next)));
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreLabelWrap}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreValue}>{value}</Text>
      </View>
      <View style={styles.scoreActions}>
        <Pressable accessibilityRole="button" onPress={() => setScore(value - 5)} style={({ pressed }) => [styles.scoreButton, pressed && styles.scoreButtonPressed]}>
          <MaterialIcons name="remove" size={16} color="#CBD5E1" />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setScore(value + 5)} style={({ pressed }) => [styles.scoreButton, pressed && styles.scoreButtonPressed]}>
          <MaterialIcons name="add" size={16} color="#CBD5E1" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  peopleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  personButton: {
    maxWidth: '48%',
    minHeight: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personButtonActive: {
    borderColor: 'rgba(167,139,250,0.5)',
    backgroundColor: 'rgba(124,58,237,0.24)',
  },
  personButtonPressed: {
    opacity: 0.76,
  },
  personText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
  },
  personTextActive: {
    color: '#FFFFFF',
  },
  scoreRow: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.52)',
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
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
  },
  scoreValue: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '900',
  },
  scoreActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  scoreButtonPressed: {
    opacity: 0.2,
  },
  input: {
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(15,23,42,0.52)',
    color: '#F8FAFC',
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  submitButton: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    borderWidth: 1,
    borderColor: 'rgba(216,180,254,0.35)',
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
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
  },
  emptyTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '900',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
