import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import Sidebar from "./components/SideBar"
import { Terminal } from "./components/Terminal"
import { Editor } from "./components/Editor"

import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useProject } from "./context/ProjectContext"

export default function Ide() {
    const { id } = useParams<{ id: string }>()
    const { setActiveProjectID } = useProject()

    useEffect(() => {
        if (id) {
            setActiveProjectID(id)
        }
    }, [id, setActiveProjectID])

    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="w-screen h-screen"
        >
            {/* LEFT SIDEBAR */}
            <ResizablePanel defaultSize={20} minSize={15}>
                <Sidebar />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* RIGHT SIDE (VERTICAL SPLIT) */}
            <ResizablePanel defaultSize={80}>
                <ResizablePanelGroup orientation="vertical">

                    {/* TOP - EDITOR */}
                    <ResizablePanel defaultSize={70} minSize={20}>
                        <Editor />
                    </ResizablePanel>


                    <ResizableHandle withHandle />

                    {/* BOTTOM - TERMINAL */}
                    <ResizablePanel defaultSize={30} minSize={10}>
                        <Terminal />
                    </ResizablePanel>


                </ResizablePanelGroup>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}