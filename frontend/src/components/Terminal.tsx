import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { useProject } from '../context/ProjectContext';
import { Plus, X, Globe, SquareTerminal, Rocket } from 'lucide-react';
import axios from 'axios';

interface Session {
  id: string;
  name: string;
  index: number;
}

function TerminalInstance({
  isActive,
  projectId,
}: {
  isActive: boolean;
  projectId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      lineHeight: 1.5,
      letterSpacing: 0.5,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Geist Mono", Menlo, monospace',
      theme: {
        background:   '#11111b', // Catppuccin Mocha Mantle
        foreground:   '#cdd6f4',
        cursor:       '#f5e0dc',
        cursorAccent: '#1e1e2e',
        selectionBackground: '#585b7066',
        black:        '#45475a',
        red:          '#f38ba8',
        green:        '#a6e3a1',
        yellow:       '#f9e2af',
        blue:         '#89b4fa',
        magenta:      '#cba6f7',
        cyan:         '#89dceb',
        white:        '#bac2de',
        brightBlack:  '#585b70',
        brightRed:    '#f38ba8',
        brightGreen:  '#a6e3a1',
        brightYellow: '#f9e2af',
        brightBlue:   '#89b4fa',
        brightMagenta:'#cba6f7',
        brightCyan:   '#89dceb',
        brightWhite:  '#a6adc8',
      },
      allowTransparency: true,
      scrollback: 5000,
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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/${projectId}?token=${token}&cols=${term.cols}&rows=${term.rows}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      fitAddon.fit();
      // Send a newline to trigger the shell prompt
      ws.send(JSON.stringify({ type: 'terminal', projectId, filePath: '', payload: '\n' }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'terminal') {
          term.write(msg.payload);
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    ws.onerror = () => {
      term.write('\r\n\x1b[1;31m✗ Connection error. Please refresh.\x1b[0m\r\n');
    };

    ws.onclose = () => {
      term.write('\r\n\x1b[38;5;240m[session closed]\x1b[0m\r\n');
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'terminal', projectId, filePath: '', payload: data }));
      }
    });

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      ws.close();
    };
  }, [projectId]);

  // Welcome message removed as per user request for cleaner terminal start

  useEffect(() => {
    if (isActive && terminalRef.current) {
      terminalRef.current.focus();
      // Re-fit on tab switch
      setTimeout(() => {
        const container = containerRef.current;
        if (container) {
          const fitAddon = new FitAddon();
          terminalRef.current?.loadAddon(fitAddon);
          fitAddon.fit();
        }
      }, 50);
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 px-1 pt-1 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
    />
  );
}

let sessionCounter = 0;

export function Terminal() {
  const { activeProjectID } = useProject();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProjectID) return;
    setUrl(null);

    let interval: ReturnType<typeof setInterval>;

    const fetchURL = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/user/projects/${activeProjectID}/port`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.url) {
          setUrl(res.data.url);
          return true;
        }
      } catch (e) {
        console.error(e);
      }
      return false;
    };

    fetchURL().then((found) => {
      if (!found) {
        interval = setInterval(async () => {
          const ok = await fetchURL();
          if (ok) clearInterval(interval);
        }, 3000);
      }
    });

    return () => { if (interval) clearInterval(interval); };
  }, [activeProjectID]);

  useEffect(() => {
    if (sessions.length === 0 && activeProjectID) {
      createSession();
    }
  }, [activeProjectID]);

  const createSession = () => {
    sessionCounter += 1;
    const id = crypto.randomUUID();
    setSessions((prev) => [...prev, { id, name: `bash ${sessionCounter}`, index: sessionCounter }]);
    setActiveSessionId(id);
  };

  const removeSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeSessionId === id && next.length > 0) {
        setActiveSessionId(next[next.length - 1].id);
      }
      return next;
    });
  };

  if (!activeProjectID) {
    return (
      <div className="h-full w-full bg-[#0d0d0d] flex items-center justify-center border-t border-zinc-800/40">
        <div className="flex items-center gap-2 text-zinc-700">
          <SquareTerminal size={16} />
          <span className="text-[11px] font-mono tracking-widest uppercase">No Active Project</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0d0d0d] flex flex-col border-t border-zinc-800/40">
      {/* Tab Bar */}
      <div className="h-9 bg-[#111111] border-b border-zinc-800/50 flex items-center justify-between shrink-0 px-1">
        <div className="flex items-center gap-0.5 overflow-x-auto hide-scrollbar">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`group flex items-center gap-1.5 px-3 py-1 rounded cursor-pointer transition-all text-[11px] font-mono select-none ${
                activeSessionId === session.id
                  ? 'bg-[#1e1e2e] text-[#cba6f7] border border-[#313244]'
                  : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/50 border border-transparent'
              }`}
            >
              <span className={activeSessionId === session.id ? 'text-[#a6e3a1]' : 'text-zinc-700'}>❯</span>
              <span>{session.name}</span>
              <X
                size={11}
                className="opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity ml-0.5 shrink-0"
                onClick={(e) => removeSession(session.id, e)}
              />
            </div>
          ))}
          <button
            onClick={createSession}
            className="flex items-center justify-center w-7 h-7 text-zinc-700 hover:text-zinc-400 hover:bg-zinc-900/50 rounded transition-all ml-0.5"
            title="New Terminal"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Open App Button */}
        <div className="flex items-center gap-2 pr-2 shrink-0">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 px-3 py-1 bg-[#1e1e2e] hover:bg-[#313244] text-[#89b4fa] border border-[#313244] hover:border-[#89b4fa]/40 rounded text-[11px] font-mono transition-all"
            >
              <Rocket size={11} className="group-hover:translate-y-[-1px] transition-transform" />
              <span>Open App</span>
              <Globe size={10} className="text-[#6c7086]" />
            </a>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 text-[#6c7086] border border-zinc-800/50 rounded text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/70 animate-pulse" />
              <span>Starting…</span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Instances */}
      <div className="flex-1 relative overflow-hidden bg-[#0d0d0d]">
        {sessions.map((session) => (
          <TerminalInstance
            key={session.id}
            isActive={activeSessionId === session.id}
            projectId={activeProjectID as string}
          />
        ))}
      </div>
    </div>
  );
}
