import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

interface NativeLearningPlugin {
  readAll(): Promise<{ values: Record<string, string> }>;
  write(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
  clear(): Promise<void>;
  narrationAvailable(options: { language: string }): Promise<{ available: boolean }>;
  speak(options: { text: string; language: string; rate: number; pitch: number; volume?: number; requestId?: string }): Promise<void>;
  stopSpeaking(): Promise<void>;
  addListener(
    eventName: 'speechState',
    listener: (event: { speaking: boolean; requestId?: string; error?: boolean }) => void
  ): Promise<PluginListenerHandle>;
}

export interface PlatformRuntime {
  readonly native: boolean;
  readonly platform: 'web' | 'android' | 'ios';
}

export const nativeLearning = registerPlugin<NativeLearningPlugin>('NativeLearning');

export const platformRuntime: PlatformRuntime = {
  native: Capacitor.isNativePlatform(),
  platform: Capacitor.getPlatform() as PlatformRuntime['platform']
};

let initialization: Promise<void> | undefined;

async function initialize(): Promise<void> {
  const handles: PluginListenerHandle[] = [];
  try {
  handles.push(await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    window.dispatchEvent(new CustomEvent('lomdim:app-state', { detail: { isActive } }));
  }));

  if (platformRuntime.platform === 'android') {
    handles.push(await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const event = new CustomEvent('lomdim:native-back', { cancelable: true });
      window.dispatchEvent(event);
      if (event.defaultPrevented) return;
      if (canGoBack) window.history.back();
      else void CapacitorApp.minimizeApp();
    }));
  }
  } catch (error) {
    await Promise.allSettled(handles.map(handle => handle.remove()));
    throw error;
  }
}

export async function initializePlatformRuntime(): Promise<void> {
  if (!platformRuntime.native) return;
  initialization ??= initialize().catch(error => { initialization = undefined; throw error; });
  await initialization;
}
