import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, isDestructive = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#0d1117] border border-slate-800 rounded-xl shadow-2xl w-full max-w-sm flex flex-col p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3 mt-auto">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
