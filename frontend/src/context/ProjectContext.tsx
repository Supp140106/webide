import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isSelectable: boolean;
}

interface ProjectContextType {
  activeProjectID: string | null;
  setActiveProjectID: (id: string | null) => void;
  fileTree: FileNode[];
  loadFileTree: () => Promise<void>;
  openFile: (path: string) => Promise<string>;
  saveFile: (path: string, content: string) => Promise<void>;
  activeFile: string | null;
  setActiveFile: (path: string | null) => void;
  closeProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProjectID, setActiveProjectID] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const loadFileTree = async () => {
    if (!activeProjectID) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:3000/user/projects/${activeProjectID}/tree`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFileTree(res.data);
    } catch (err) {
      console.error("Failed to load file tree", err);
    }
  };

  const openFile = async (path: string) => {
    if (!activeProjectID) return '';
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:3000/user/projects/${activeProjectID}/file?path=${path}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.content;
    } catch (err) {
      console.error("Failed to open file", err);
      return '';
    }
  };

  const saveFile = async (path: string, content: string) => {
    if (!activeProjectID) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3000/user/projects/${activeProjectID}/file`, {
        path,
        content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to save file", err);
    }
  };

  const closeProject = async () => {
    if (!activeProjectID) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3000/user/projects/${activeProjectID}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveProjectID(null);
      setFileTree([]);
      setActiveFile(null);
    } catch (err) {
      console.error("Failed to close project", err);
      throw err;
    }
  };

  useEffect(() => {
    if (activeProjectID) {
      loadFileTree();
    }
  }, [activeProjectID]);

  return (
    <ProjectContext.Provider value={{ 
      activeProjectID, 
      setActiveProjectID, 
      fileTree, 
      loadFileTree, 
      openFile, 
      saveFile,
      activeFile,
      setActiveFile,
      closeProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
