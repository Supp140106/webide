import { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { X, Save, FileCode } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

interface Tab {
  id: string; // File path
  name: string;
  language: string;
  content: string;
  isDirty: boolean;
}

export function Editor() {
  const { activeFile, setActiveFile, openFile, saveFile } = useProject();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // When a file is selected in sidebar (from context)
  useEffect(() => {
    if (activeFile) {
        loadFile(activeFile);
    }
  }, [activeFile]);

  const loadFile = async (path: string) => {
    // Check if already open
    if (tabs.find(t => t.id === path)) {
        setActiveId(path);
        return;
    }

    const content = await openFile(path);
    const name = path.split('/').pop() || path;
    const ext = name.split('.').pop() || '';
    
    let language = 'plaintext';
    if (['ts', 'tsx'].includes(ext)) language = 'typescript';
    else if (['js', 'jsx'].includes(ext)) language = 'javascript';
    else if (ext === 'css') language = 'css';
    else if (ext === 'json') language = 'json';
    else if (ext === 'html') language = 'html';

    const newTab: Tab = {
        id: path,
        name,
        language,
        content,
        isDirty: false
    };

    setTabs(prev => [...prev, newTab]);
    setActiveId(path);
  };

  const activeTab = tabs.find(t => t.id === activeId);

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (activeId === id && remaining.length > 0) {
      setActiveId(remaining[remaining.length - 1].id);
    } else if (remaining.length === 0) {
      setActiveId(null);
      setActiveFile(null);
    }
  };

  const handleChange = (value: string | undefined) => {
    setTabs(prev =>
      prev.map(t => (t.id === activeId ? { ...t, content: value ?? '', isDirty: true } : t))
    );
  };

  const handleSave = async () => {
    if (activeTab && activeTab.isDirty) {
        await saveFile(activeTab.id, activeTab.content);
        setTabs(prev =>
            prev.map(t => (t.id === activeId ? { ...t, isDirty: false } : t))
        );
    }
  };

  if (!activeTab) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] text-slate-600">
            <FileCode size={64} className="mb-4 opacity-20" />
            <p className="text-sm">Select a file to start editing</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* Tab Bar */}
      <div className="flex items-center bg-[#010409] border-b border-slate-800/60 overflow-x-auto shrink-0">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => {
                setActiveId(tab.id);
                setActiveFile(tab.id);
            }}
            className={`
              group flex items-center gap-2 px-4 py-2.5 cursor-pointer border-r border-slate-800/60
              text-xs transition-all select-none shrink-0
              ${
                activeId === tab.id
                  ? 'bg-[#050505] text-slate-200 border-t-2 border-t-blue-500'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
              }
            `}
          >
            <span className="font-medium">{tab.name}{tab.isDirty && '*'}</span>
            <button
              onClick={e => closeTab(e, tab.id)}
              className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button 
            onClick={handleSave}
            className="ml-auto px-4 text-blue-500 hover:text-blue-400 disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
            disabled={!activeTab.isDirty}
        >
            <Save size={14} />
            Save
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-1.5 text-[11px] text-slate-500 border-b border-slate-800/40 bg-[#050505] font-mono shrink-0">
        <span className="text-slate-400">{activeTab.id}</span>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          key={activeTab.id}
          height="100%"
          language={activeTab.language}
          value={activeTab.content}
          onChange={handleChange}
          onMount={(_editor, monaco) => {
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: true,
              noSyntaxValidation: false, // Keep syntax checks for basic errors
            });
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: true,
              noSyntaxValidation: false,
            });
          }}
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
