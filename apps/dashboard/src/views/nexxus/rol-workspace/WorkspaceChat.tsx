import { useState } from "react";
import InternalChatPanel from "views/nexxus/components/InternalChatPanel";
import NexxusAiChatPanel from "views/nexxus/components/NexxusAiChatPanel";
import VoiceAiPanel from "views/nexxus/components/VoiceAiPanel";

// Paneles compartidos para que empleado, jefe y admin disfruten de la misma experiencia completa.
export function WorkspaceAi() {
  const [voiceOpen, setVoiceOpen] = useState(false);

  return (
    <>
      <NexxusAiChatPanel
        title="Nexxus IA"
        subtitle="Consulta procesos, tareas y recursos de tu espacio de trabajo."
        onOpenVoice={() => setVoiceOpen(true)}
      />
      {voiceOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-md transition-all sm:p-6 animate-fadeIn">
          <VoiceAiPanel onClose={() => setVoiceOpen(false)} />
        </div>
      ) : null}
    </>
  );
}

export function WorkspaceInternalChat() {
  return <InternalChatPanel title="Chat interno" description="Conversaciones de trabajo con tu equipo y compañeros." />;
}
