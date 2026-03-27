import { Tree } from "@/components/ui/file-tree"
import type { TreeViewElement } from "@/components/ui/file-tree"
import { useAuth } from "../context/AuthContext"
import { LogOut, Settings } from "lucide-react"

const ELEMENTS: TreeViewElement[] = [
    {
        id: "src",
        type: "folder",
        isSelectable: true,
        name: "src",
        children: [
            {
                id: "lib",
                type: "folder",
                isSelectable: true,
                name: "lib",
                children: [
                    {
                        id: "utils",
                        isSelectable: true,
                        name: "utils.ts",
                    },
                ],
            },
            {
                id: "app",
                type: "folder",
                isSelectable: true,
                name: "app",
                children: [
                    {
                        id: "page",
                        isSelectable: true,
                        name: "page.tsx",
                    },
                    {
                        id: "layout",
                        isSelectable: true,
                        name: "layout.tsx",
                    },
                ],
            },
            {
                id: "components",
                type: "folder",
                isSelectable: true,
                name: "components",
                children: [
                    {
                        id: "header",
                        isSelectable: true,
                        name: "header.tsx",
                    },
                    {
                        id: "ui",
                        type: "folder",
                        isSelectable: true,
                        name: "ui",
                        children: [
                            {
                                id: "button",
                                isSelectable: true,
                                name: "button.tsx",
                            },
                        ],
                    },
                    {
                        id: "footer",
                        isSelectable: true,
                        name: "footer.tsx",
                    },
                ],
            },
        ],
    },
]

export default function Sidebar() {
    const { user, logout } = useAuth()

    return (
        <div
            className="h-full bg-black text-white flex flex-col border-r border-zinc-800"
            style={{
                // Override the `bg-muted` class used by file-tree for selected items
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ["--muted" as any]: "0 0% 12%",             // zinc-900 background
                ["--muted-foreground" as any]: "0 0% 100%", // white text
            }}
        >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <span className="font-bold text-zinc-400 text-xs uppercase tracking-widest">Explorer</span>
                <Settings size={14} className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" />
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-auto p-2 custom-scrollbar">
                <Tree
                    elements={ELEMENTS}
                    initialExpandedItems={["src", "components", "ui", "app", "lib"]}
                    initialSelectedId="button"
                    className="text-sm text-zinc-300 [&_*]:text-zinc-300 hover:[&_.folder]:text-white transition-colors"
                />
            </div>

            {/* User Profile */}
            <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-900/20">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium border border-zinc-700/50 transition-all active:scale-95"
                >
                    <LogOut size={14} />
                    Sign Out
                </button>
            </div>
        </div>
    )
}