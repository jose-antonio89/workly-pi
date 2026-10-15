import { useRef } from 'react';
import { ModuleButton } from '../ui/ModuleUI';
import { LoadingState } from '../ui/Feedback';

export default function MessageCompose({ direct = false, text, setText, busy, onSend }) {
  const form = useRef(null);
  return (
    <form
      ref={form}
      id={direct ? 'chatForm' : 'messageForm'}
      onSubmit={(event) => {
        event.preventDefault();
        const value = text.trim();
        if (value) onSend(value);
      }}
      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-[#94a3b8]/16 bg-white ${direct ? 'p-4' : 'p-[18px]'} legacy-max-640:grid-cols-1 dark:border-[#94a3b8]/14 ${direct ? 'dark:bg-transparent' : 'dark:bg-[#0a1222]/94'}`}
    >
      <textarea
        id={direct ? 'chatText' : 'messageText'}
        aria-label={direct ? 'Escreva sua mensagem' : 'Digite sua mensagem'}
        maxLength="2000"
        required
        placeholder={direct ? 'Escreva sua mensagem...' : 'Digite sua mensagem...'}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={
          direct
            ? undefined
            : (event) => {
                if (
                  event.key !== 'Enter' ||
                  event.shiftKey ||
                  event.ctrlKey ||
                  event.altKey ||
                  event.metaKey ||
                  event.nativeEvent.isComposing
                )
                  return;
                event.preventDefault();
                if (text.trim() && !busy) form.current.requestSubmit();
              }
        }
        className={`w-full min-w-0 text-[13.3333px] ${direct ? 'min-h-[54px]' : 'min-h-[76px] legacy-max-640:min-h-16'} max-h-[150px] resize-y rounded-2xl border border-[#94a3b8]/28 px-[15px] py-3.5 text-[#0f172a] outline-none focus:border-workly-primary/55 focus:shadow-[0_0_0_4px_rgba(4,191,85,0.1)] dark:border-[#5e82ac]/22 dark:bg-[#070d1a]/72 dark:text-[#eef4ff]`}
      />
      <ModuleButton type="submit" disabled={busy}>
        <i aria-hidden="true" className={busy ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'} />
        {busy ? <LoadingState inline message="Enviando..." /> : 'Enviar'}
      </ModuleButton>
    </form>
  );
}
