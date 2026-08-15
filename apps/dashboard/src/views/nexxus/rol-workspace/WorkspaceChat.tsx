import InternalChatPanel from "views/nexxus/components/InternalChatPanel";
import NexxusAiChatPanel from "views/nexxus/components/NexxusAiChatPanel";

// Antes estas dos pantallas tenían versiones reducidas propias (sin avatares, adjuntos, límite de
// plan ni indicador de no leído) mientras que "Mensajería" y "Nexxus IA" en el panel de admin sí
// los tenían. Ahora las tres usan los mismos paneles compartidos para que empleado, jefe y admin
// vean exactamente la misma experiencia.
export function WorkspaceAi() {
  return <NexxusAiChatPanel title="Nexxus IA" subtitle="Consulta procesos, tareas y recursos de tu espacio de trabajo." />;
}

export function WorkspaceInternalChat() {
  return <InternalChatPanel title="Chat interno" description="Conversaciones de trabajo con tu equipo y compañeros." />;
}
