import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { get, post } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Users, Clock } from 'lucide-react';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  identifier: string;
  description?: string;
  icon: string;
  color: string;
  memberCount: number;
  lastActivity: string;
}

const WORKSPACE_ID = 'default';

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ProjectList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', identifier: '', description: '', icon: 'Folder', color: '#8B5CF6' });
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => get<Project[]>('/projects', { workspaceId: WORKSPACE_ID }),
  });

  const createProject = useMutation({
    mutationFn: () => post('/projects', { ...form, workspaceId: WORKSPACE_ID }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCreateOpen(false);
      setForm({ name: '', identifier: '', description: '', icon: 'Folder', color: '#8B5CF6' });
      toast.success('Project created');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Projects</h1>
          <p className="text-sm text-text-secondary">Manage your workspace projects.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-default border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
          <p className="text-sm">No projects yet. Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group block p-4 rounded-lg border border-border-default bg-surface-raised hover:shadow-[var(--shadow-2)] transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: project.color + '20', color: project.color }}
                >
                  <LucideIcon name={project.icon || 'Folder'} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent-default transition-colors truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-text-tertiary font-mono">{project.identifier}</p>
                </div>
              </div>
              {project.description && (
                <p className="text-sm text-text-secondary mt-2 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-text-tertiary">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {project.memberCount}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {timeAgo(project.lastActivity)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    identifier: name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6),
                  }));
                }}
                placeholder="My Project"
              />
            </div>
            <div className="space-y-2">
              <Label>Identifier</Label>
              <Input
                value={form.identifier}
                onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value.toUpperCase() }))}
                placeholder="PROJ"
                maxLength={6}
              />
              <p className="text-xs text-text-tertiary">Used as prefix for items (e.g. PROJ-123)</p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-8 h-8 rounded cursor-pointer border border-border-default"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createProject.mutate()}
              disabled={!form.name || !form.identifier || createProject.isPending}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
