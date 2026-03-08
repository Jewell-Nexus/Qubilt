import type React from 'react';

export interface ExtensionRegistration {
  component: React.ComponentType<any>;
  priority: number;
}

class ExtensionRegistry {
  private slots = new Map<string, ExtensionRegistration[]>();
  private listeners = new Set<() => void>();

  register(slot: string, component: React.ComponentType<any>, priority = 0): void {
    const current = this.slots.get(slot) || [];
    current.push({ component, priority });
    current.sort((a, b) => b.priority - a.priority);
    this.slots.set(slot, current);
    this.notify();
  }

  unregister(slot: string, component: React.ComponentType<any>): void {
    const current = this.slots.get(slot);
    if (!current) return;
    const filtered = current.filter((ext) => ext.component !== component);
    if (filtered.length === 0) {
      this.slots.delete(slot);
    } else {
      this.slots.set(slot, filtered);
    }
    this.notify();
  }

  get(slot: string): ExtensionRegistration[] {
    return this.slots.get(slot) || [];
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const extensionRegistry = new ExtensionRegistry();
