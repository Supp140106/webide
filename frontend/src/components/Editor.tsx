import { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { X, Plus } from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  language: string;
  content: string;
}

const DEFAULT_TABS: Tab[] = [
  {
    id: 'page',
    name: 'page.tsx',
    language: 'typescript',
    content: `import { useState } from 'react';

export default function Page() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Hello, WebIDE!</h1>
      <p className="text-lg text-gray-500 mb-8">
        Start building something awesome.
      </p>
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        onClick={() => setCount(c => c + 1)}
      >
        Count: {count}
      </button>
    </div>
  );
}
`,
  },
  {
    id: 'layout',
    name: 'layout.tsx',
    language: 'typescript',
    content: `import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My WebIDE App</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
`,
  },
];

const LANG_COLOR: Record<string, string> = {
  typescript: 'text-blue-400',
  javascript: 'text-yellow-400',
  css: 'text-pink-400',
  json: 'text-orange-400',
};

const LANG_BADGE: Record<string, string> = {
  typescript: 'TSX',
  javascript: 'JS',
  css: 'CSS',
  json: 'JSON',
};

export function Editor() {
  const [tabs, setTabs] = useState<Tab[]>(DEFAULT_TABS);
  const [activeId, setActiveId] = useState<string>(DEFAULT_TABS[0].id);

  const activeTab = tabs.find(t => t.id === activeId) ?? tabs[0];

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (activeId === id && remaining.length > 0) {
      setActiveId(remaining[remaining.length - 1].id);
    }
  };

  const handleChange = (value: string | undefined) => {
    setTabs(prev =>
      prev.map(t => (t.id === activeId ? { ...t, content: value ?? '' } : t))
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Tab Bar */}
      <div className="flex items-center bg-[#010409] border-b border-slate-800/60 overflow-x-auto shrink-0">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            className={`
              group flex items-center gap-2 px-4 py-2.5 cursor-pointer border-r border-slate-800/60
              text-xs transition-all select-none shrink-0
              ${
                activeId === tab.id
                  ? 'bg-[#0d1117] text-slate-200 border-t-2 border-t-blue-500'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
              }
            `}
          >
            <span className={`text-[10px] font-bold ${LANG_COLOR[tab.language] ?? 'text-slate-400'}`}>
              {LANG_BADGE[tab.language] ?? ''}
            </span>
            <span className="font-medium">{tab.name}</span>
            <button
              onClick={e => closeTab(e, tab.id)}
              className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {/* New Tab Button */}
        <button className="px-3 py-2.5 text-slate-600 hover:text-slate-300 transition-colors shrink-0">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-1.5 text-[11px] text-slate-500 border-b border-slate-800/40 bg-[#0d1117] font-mono shrink-0">
        src <span className="mx-1 text-slate-700">/</span> app <span className="mx-1 text-slate-700">/</span>{' '}
        <span className="text-slate-400">{activeTab.name}</span>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          key={activeTab.id}
          height="100%"
          language={activeTab.language}
          value={activeTab.content}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: '"Geist Mono", "Cascadia Code", "Fira Code", Menlo, monospace',
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            padding: { top: 16, bottom: 16 },
            tabSize: 2,
            automaticLayout: true,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
}
