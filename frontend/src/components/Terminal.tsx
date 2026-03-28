import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { useProject } from '../context/ProjectContext';
import { Terminal as TerminalIcon, Plus, X, Globe } from 'lucide-react';
import axios from 'axios';

interface Session {
  id: string;
  name: string;
}

function TerminalInstance({ isActive, projectId, welcomePort }: { isActive: boolean, projectId: string, welcomePort?: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      fontFamily: '"Geist Mono", "Cascadia Code", Menlo, monospace',
      theme: {
        background: '#050505',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        selectionBackground: '#58a6ff33',
      },
      allowTransparency: true,
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    
    term.open(containerRef.current);
    terminalRef.current = term;

    const resizeObserver = new ResizeObserver(() => {
       if (isActive) fitAddon.fit();
    });
    resizeObserver.observe(containerRef.current);

    const token = localStorage.getItem('token');
    // Using the correct URL from router.go: r.GET("/ws/terminal/:id", ...)
    const ws = new WebSocket(`ws://localhost:3000/ws/terminal/${projectId}?token=${token}&cols=${term.cols}&rows=${term.rows}`);
    wsRef.current = ws;

    ws.onopen = () => {
       fitAddon.fit();
    };

    ws.onmessage = async (e) => {
       if (e.data instanceof Blob) {
           const text = await e.data.text();
           term.write(text);
       } else {
           term.write(e.data);
       }
    };

    term.onData(data => {
       if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
       }
    });

    return () => {
       resizeObserver.disconnect();
       term.dispose();
       ws.close();
    };
  }, [projectId]);

  const hasWelcomed = useRef(false);

  useEffect(() => {
     if (welcomePort && terminalRef.current && !hasWelcomed.current) {
        hasWelcomed.current = true;
        const msg = `\r\n\x1b[1;36m📦 Installing dependencies and starting the dev server in the background...\x1b[0m\r\n\x1b[1;32m🚀 Your app will soon be available at: http://localhost:${welcomePort}\x1b[0m\r\n\x1b[1;33m(Note: It may take a minute for 'npm install' to finish)\x1b[0m\r\n\r\n`;
        terminalRef.current.write('\x1b[2K\r' + msg);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
             wsRef.current.send('\n');
        }
     }
  }, [welcomePort]);

  useEffect(() => {
     if (isActive && terminalRef.current) {
         terminalRef.current.focus();
     }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 p-2 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
    />
  );
}

export function Terminal() {
  const { activeProjectID } = useProject();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [port, setPort] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProjectID) return;
    
    let interval: ReturnType<typeof setInterval>;
    
    const fetchPort = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:3000/user/projects/${activeProjectID}/port`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.port) {
            setPort(res.data.port);
            return true;
        }
      } catch (e) {
        console.error(e);
      }
      return false;
    };
    
    fetchPort().then(found => {
        if (!found) {
            interval = setInterval(async () => {
                const isFound = await fetchPort();
                if (isFound) clearInterval(interval);
            }, 3000);
        }
    });

    return () => {
        if (interval) clearInterval(interval);
    };
  }, [activeProjectID]);

  useEffect(() => {
    if (sessions.length === 0 && activeProjectID) {
      createSession();
    }
  }, [activeProjectID]);

  const createSession = () => {
    const id = crypto.randomUUID();
    setSessions(prev => [...prev, { id, name: 'bash' }]);
    setActiveSessionId(id);
  }

  const removeSession = (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     setSessions(prev => prev.filter(s => s.id !== id));
     if (activeSessionId === id && sessions.length > 1) {
         setActiveSessionId(sessions[0].id === id ? sessions[1].id : sessions[0].id);
     }
  }

  if (!activeProjectID) {
    return (
      <div className="h-full w-full bg-[#050505] flex items-center justify-center border-t border-zinc-800/50">
        <span className="text-zinc-600 text-[11px] font-mono tracking-widest uppercase">Ready</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#050505] flex flex-col border-t border-zinc-800/50 relative">
      <div className="h-9 bg-[#0a0a0a] border-b border-zinc-800/50 flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-colors border-b-2 ${
                activeSessionId === session.id 
                  ? 'bg-[#151515] border-blue-500 text-blue-400' 
                  : 'text-zinc-500 hover:bg-zinc-900 border-transparent hover:text-zinc-300'
              }`}
            >
              <TerminalIcon size={13} className={activeSessionId === session.id ? "text-blue-500" : "text-zinc-600"} />
              <span className="text-[11px] font-medium tracking-wide">{session.name}</span>
              <X 
                size={12} 
                className="opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded p-0.5 transition-all text-zinc-400" 
                onClick={(e) => removeSession(session.id, e)}
              />
            </div>
          ))}
          <button 
            onClick={createSession}
            className="p-1 px-2 text-zinc-600 hover:text-zinc-300 transition-colors ml-1 rounded flex items-center"
            title="New Terminal Session"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 pr-2">
          {port && (
            <a 
              href={`http://localhost:${port}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] active:scale-95 border border-blue-500/50"
            >
              <Globe size={13} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
              <span>Open App</span>
            </a>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {sessions.map((session, index) => (
           <TerminalInstance 
             key={session.id} 
             isActive={activeSessionId === session.id} 
             projectId={activeProjectID as string} 
             welcomePort={index === 0 ? port : null}
           />
        ))}
      </div>
    </div>
  );
}
