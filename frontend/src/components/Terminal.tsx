import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

export function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return;

    // Initialize xterm
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      fontFamily: '"Geist Mono", "Cascadia Code", "Fira Code", Menlo, monospace',
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        black: '#484f58',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#f0f6fc',
        selectionBackground: '#3fb95033',
      },
      allowTransparency: true,
      scrollback: 1000,
      tabStopWidth: 4,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;



    // Command line state
    let currentLine = '';
    const history: string[] = [];
    let historyIndex = -1;

    const prompt = () => {
      term.write('\x1b[32msupprit\x1b[0m\x1b[90m@\x1b[0m\x1b[36mwebide\x1b[0m\x1b[90m:\x1b[0m\x1b[34m~/project\x1b[0m\x1b[90m$\x1b[0m ');
    };

    const runCommand = (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      history.unshift(trimmed);
      historyIndex = -1;

      switch (trimmed.toLowerCase()) {
        case 'help':
          term.writeln('');
          term.writeln('\x1b[33m  Available commands:\x1b[0m');
          term.writeln('  \x1b[36mhelp\x1b[0m       Show this help message');
          term.writeln('  \x1b[36mclear\x1b[0m      Clear the terminal');
          term.writeln('  \x1b[36mls\x1b[0m         List files in the current directory');
          term.writeln('  \x1b[36mpwd\x1b[0m        Print working directory');
          term.writeln('  \x1b[36mecho\x1b[0m       Print a message');
          term.writeln('  \x1b[36mdate\x1b[0m       Print current date and time');
          term.writeln('  \x1b[36mwhoami\x1b[0m     Print current user');
          term.writeln('');
          break;
        case 'clear':
          term.clear();
          break;
        case 'ls':
          term.writeln('');
          term.writeln('\x1b[34msrc/\x1b[0m         \x1b[34mnode_modules/\x1b[0m  package.json  tsconfig.json');
          term.writeln('\x1b[34mpublic/\x1b[0m      index.html     bun.lockb     vite.config.ts');
          term.writeln('');
          break;
        case 'pwd':
          term.writeln('');
          term.writeln('/home/supprit/project');
          term.writeln('');
          break;
        case 'whoami':
          term.writeln('');
          term.writeln('supprit');
          term.writeln('');
          break;
        case 'date':
          term.writeln('');
          term.writeln(new Date().toString());
          term.writeln('');
          break;
        default:
          if (trimmed.startsWith('echo ')) {
            term.writeln('');
            term.writeln(trimmed.slice(5));
            term.writeln('');
          } else {
            term.writeln('');
            term.writeln(`\x1b[31m  Command not found: \x1b[0m${trimmed}`);
            term.writeln(`\x1b[90m  Type \x1b[33mhelp\x1b[90m to see available commands.\x1b[0m`);
            term.writeln('');
          }
      }
    };

    prompt();

    term.onKey(({ key, domEvent }) => {
      const ev = domEvent;
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

      if (ev.key === 'Enter') {
        term.writeln('');
        runCommand(currentLine);
        currentLine = '';
        prompt();
      } else if (ev.key === 'Backspace') {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      } else if (ev.key === 'ArrowUp') {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          // Clear current line
          term.write('\x1b[2K\r');
          prompt();
          currentLine = history[historyIndex];
          term.write(currentLine);
        }
      } else if (ev.key === 'ArrowDown') {
        if (historyIndex > 0) {
          historyIndex--;
          term.write('\x1b[2K\r');
          prompt();
          currentLine = history[historyIndex];
          term.write(currentLine);
        } else if (historyIndex === 0) {
          historyIndex = -1;
          term.write('\x1b[2K\r');
          prompt();
          currentLine = '';
        }
      } else if (printable) {
        currentLine += key;
        term.write(key);
      }
    });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      terminalRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-slate-400 ml-2 font-mono">bash — WebIDE</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
          <span>~/project</span>
        </div>
      </div>

      {/* XTerm Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{ padding: '8px' }}
      />
    </div>
  );
}
