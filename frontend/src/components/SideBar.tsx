import { Tree } from "@/components/ui/file-tree"
import { useAuth } from "../context/AuthContext"
import { useProject } from "../context/ProjectContext"
import { LogOut, Settings, RefreshCw } from "lucide-react"
import { useState } from "react"
import { ConfirmModal } from "./ConfirmModal"

export default function Sidebar() {
    const { user, logout } = useAuth()
    const { fileTree, loadFileTree, setActiveFile, closeProject } = useProject()
    const [isClosing, setIsClosing] = useState(false)

    return (
        <div
            className="h-full bg-[#050505] text-zinc-300 flex flex-col border-r border-zinc-800/50"
            style={{
                // Override the `bg-muted` class used by file-tree for selected items
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ["--muted" as any]: "0 0% 8%",             // ultra dark background
                ["--muted-foreground" as any]: "0 0% 100%", // white text
            }}
        >
            {/* Header */}
            <div className="p-3 px-4 border-b border-zinc-800/50 flex items-center justify-between">
                <span className="font-medium text-zinc-500 text-[10px] uppercase tracking-widest">Explorer</span>
                <div className="flex items-center gap-2">
                    <RefreshCw 
                        size={14} 
                        className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" 
                        onClick={() => loadFileTree()}
                    />
                    <Settings size={14} className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" />
                </div>
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-auto p-2 custom-scrollbar">
                {fileTree.length > 0 ? (
                    <Tree
                        elements={fileTree}
                        initialExpandedItems={[]}
                        onFileSelect={(id: string) => setActiveFile(id)}
                        className="text-sm text-zinc-300 [&_*]:text-zinc-300 hover:[&_.folder]:text-white transition-colors"
                    />
                ) : (
                    <div className="p-4 text-xs text-zinc-500 italic">
                        No files found or project loading...
                    </div>
                )}
            </div>

            {/* User Profile */}
            <div className="p-4 bg-[#0a0a0a] border-t border-zinc-800/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-300 font-medium text-xs shadow-inner border border-zinc-700/50">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-zinc-200 truncate">{user?.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setIsClosing(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-500/5 hover:bg-red-500/10 text-red-500/80 hover:text-red-400 rounded-lg text-xs font-medium border border-red-500/10 transition-all active:scale-95"
                    >
                        <LogOut size={14} />
                        Close Project
                    </button>
                    
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs font-medium border border-zinc-800 hover:border-zinc-700 transition-all active:scale-95"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>

                <ConfirmModal
                    isOpen={isClosing}
                    title="Close Project"
                    message="Are you sure you want to close this project? The environment will safely save your files to the database and cleanly stop."
                    confirmText="Close Project"
                    onCancel={() => setIsClosing(false)}
                    onConfirm={async () => {
                        await closeProject();
                        setIsClosing(false);
                        window.location.href = '/dashboard';
                    }}
                />
            </div>
        </div>
    )
}