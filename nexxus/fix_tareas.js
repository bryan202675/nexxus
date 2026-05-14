const fs = require('fs');

const file = '/Users/bryan/Desktop/nexxus1.1/app/src/presentation/screens/MiPulso.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* ORDEN 4: HISTORIAL DE TAREAS \*\/\}.*?<\/TarjetaAnimada>/s;

const replacement = `{/* ORDEN 4: HISTORIAL DE TAREAS */}
        {(tareasPendientes.length > 0 || tareasCompletadas.length > 0) && (
          <TarjetaAnimada index={3} style={estilos.seccion}>
            <View style={estilos.cabeceraSeccion}>
              <Text style={estilos.tituloSeccion}>Mis Tareas</Text>
            </View>
            
            {tareasPendientes.length > 0 && (
              <View style={estilos.bloqueTareas}>
                <Text style={estilos.subtituloTareas}>PENDIENTES ({tareasPendientes.length})</Text>
                {tareasPendientes.slice(0, 4).map(tarea => (
                  <BotonAnimado key={tarea.id} style={estilos.tarjetaTareaPremium} scaleTo={0.98} onPress={() => {
                    Alert.alert('Completar', '¿Marcar como completada?', [
                      { text: 'No', style: 'cancel' }, { text: 'Sí', style: 'default', onPress: () => cambiarEstadoTarea(tarea.id, 'completada') }
                    ]);
                  }}>
                    <View style={estilos.headerTarea}>
                      <View style={estilos.filaTituloTarea}>
                        <View style={[estilos.puntoPrioridad, { backgroundColor: obtenerColorPrioridad(tarea.prioridad) }]} />
                        <Text style={estilos.tituloTareaPremium} numberOfLines={1}>{tarea.titulo}</Text>
                      </View>
                      <View style={[estilos.chipPrioridad, { backgroundColor: obtenerColorPrioridad(tarea.prioridad) + '15' }]}>
                        <Text style={[estilos.textoChipPrioridad, { color: obtenerColorPrioridad(tarea.prioridad) }]}>{tarea.prioridad}</Text>
                      </View>
                    </View>
                    <Text style={estilos.descTareaPremium} numberOfLines={2}>{tarea.descripcion || 'Sin descripción detallada.'}</Text>
                    <View style={estilos.footerTareaPremium}>
                      <View style={estilos.fechaTareaCont}>
                        <MaterialIcons name="schedule" size={14} color={COLORES.textoSuave} />
                        <Text style={estilos.fechaTareaTexto}>Acción requerida</Text>
                      </View>
                      <MaterialIcons name="radio-button-unchecked" size={24} color={COLORES.textoSuave} />
                    </View>
                  </BotonAnimado>
                ))}
              </View>
            )}

            {tareasCompletadas.length > 0 && (
              <View style={estilos.bloqueTareas}>
                <Text style={estilos.subtituloTareas}>COMPLETADAS RECIENTEMENTE</Text>
                {tareasCompletadas.slice(0, 3).map(tarea => (
                  <View key={tarea.id} style={[estilos.tarjetaTareaPremium, estilos.tarjetaTareaCompletada]}>
                    <View style={estilos.headerTarea}>
                      <View style={estilos.filaTituloTarea}>
                        <MaterialIcons name="check-circle" size={18} color={COLORES.exito} style={{ marginRight: 8 }} />
                        <Text style={estilos.tituloTareaCompletada} numberOfLines={1}>{tarea.titulo}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </TarjetaAnimada>
        )}`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Fixed tareas in MiPulso.tsx');