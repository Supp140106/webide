import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, Loader2, ArrowRight, Clock, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface Project {
  id: string;
  name: string;
  repoUrl: string;
  updatedAt: string;
}

export function RecentProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('/api/user/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The backend now returns { owned: [], shared: [] }
      const owned = res.data.owned || [];
      const shared = res.data.shared || [];
      setProjects([...owned, ...shared]);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = async (projectId: string) => {
    if (openingId) return;
    setOpeningId(projectId);
    try {
      const project = projects.find(p => p.id === projectId);
      const token = localStorage.getItem('token');
      await axios.post('/api/user/open-project', 
        { projectId, repoUrl: project?.repoUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/project/${projectId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to open project. It might be corrupted.");
    } finally {
      setOpeningId(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/user/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Failed to delete project.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 w-full">
        <Loader2 className="animate-spin text-zinc-600" size={24} />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderGit2 className="text-zinc-800 mb-4" size={48} strokeWidth={1} />
        <h3 className="text-sm font-medium text-zinc-400 mb-1">No projects found</h3>
        <p className="text-xs text-zinc-600">Import a new repository to get started.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col">
        {projects.map((project) => (
          <div 
            key={project.id}
            onClick={() => handleOpenProject(project.id)}
            className="group flex flex-col sm:flex-row sm:items-center justify-between py-4 px-4 hover:bg-zinc-900/50 border-b border-zinc-800/40 last:border-0 cursor-pointer transition-colors duration-200"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0 mb-3 sm:mb-0">
              <div className="p-2 rounded-lg bg-zinc-900/80 text-zinc-500 group-hover:text-blue-400 transition-all shrink-0">
                <FolderGit2 size={16} strokeWidth={1.5} />
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                  <h3 className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors truncate">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-zinc-600 mt-1 sm:mt-0">
                    <Clock size={12} />
                    <span className="text-[11px] font-medium tracking-wide">
                        {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Unknown'}
                    </span>
                  </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 sm:ml-4 shrink-0 self-end sm:self-auto">
              <span className="text-[10px] text-zinc-700 font-mono hidden md:block">ID: {project.id.slice(0,8)}</span>

              <div className="flex items-center gap-2">
                {openingId === project.id ? (
                  <Loader2 className="animate-spin text-zinc-500" size={16} />
                ) : (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setProjectToDelete(project.id); }}
                      className="p-1.5 text-zinc-600 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-colors opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ArrowRight size={16} className="text-zinc-600 group-hover:text-white transform translate-x-0 group-hover:translate-x-1 transition-all ml-1" />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {projectToDelete && (
        <ConfirmModal
          isOpen={!!projectToDelete}
          title="Delete Project"
          message="Are you sure you want to permanently delete this project? This action cannot be undone."
          confirmText="Delete"
          isDestructive={true}
          onCancel={() => setProjectToDelete(null)}
          onConfirm={() => handleDeleteProject(projectToDelete)}
        />
      )}
    </div>
  );
}
