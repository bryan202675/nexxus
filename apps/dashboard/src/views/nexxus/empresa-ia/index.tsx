import { useState } from "react";

import NexxusAiChatPanel from "views/nexxus/components/NexxusAiChatPanel";
import VoiceAiPanel from "views/nexxus/components/VoiceAiPanel";

export default function ChatIAAdmin() {
  const [voiceOpen, setVoiceOpen] = useState(false);

  return (
    <>
      <NexxusAiChatPanel onOpenVoice={() => setVoiceOpen(true)} />
      {voiceOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-md transition-all sm:p-6 animate-fadeIn">
          <VoiceAiPanel onClose={() => setVoiceOpen(false)} />
        </div>
      ) : null}
    </>
  );
}
