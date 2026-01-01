// Project Editor Store
// Shared asset library and editor state management

export interface UploadedAsset {
  id: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  src: string; // object URL or data URL
  origin: 'uploader' | 'editor'; // Where it was uploaded from
  objectUrl?: string; // If using URL.createObjectURL, store for cleanup
  file?: File; // Original file (for cleanup)
}

// Konva object types
export type KonvaObjectType = 'image' | 'label' | 'qr' | 'skeletonKey' | 'frame';

export interface KonvaObject {
  id: string;
  type: KonvaObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  // Type-specific data
  assetId?: string; // For images
  text?: string; // For labels
  labelShape?: string; // For labels
  // ... other properties as needed
}

export interface EditorState {
  // Assets (shared across all sides)
  assets: UploadedAsset[];
  
  // Current print spec
  printSpecId: string;
  currentSide: 'front' | 'inside' | 'back';
  
  // Per-side scene graph
  sides: {
    front: KonvaObject[];
    inside: KonvaObject[];
    back: KonvaObject[];
  };
  
  // UI state
  showBleed: boolean;
  showTrim: boolean;
  showSafe: boolean;
  
  // Selection
  selectedObjectId: string | null;
  
  // Undo/Redo
  history: EditorState[];
  historyIndex: number;
}

// Simple store using a class (can be replaced with Zustand/Context later)
class ProjectEditorStore {
  private state: EditorState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = {
      assets: [],
      printSpecId: 'poster_simple',
      currentSide: 'front',
      sides: {
        front: [],
        inside: [],
        back: [],
      },
      showBleed: false,
      showTrim: false,
      showSafe: true,
      selectedObjectId: null,
      history: [],
      historyIndex: -1,
    };
  }

  getState(): EditorState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // Asset management
  addAsset(asset: UploadedAsset) {
    this.state.assets.push(asset);
    this.notify();
  }

  removeAsset(assetId: string) {
    const asset = this.state.assets.find((a) => a.id === assetId);
    if (asset?.objectUrl) {
      URL.revokeObjectURL(asset.objectUrl);
    }
    this.state.assets = this.state.assets.filter((a) => a.id !== assetId);
    this.notify();
  }

  // Object management
  addObject(object: KonvaObject) {
    this.saveStateToHistory();
    this.state.sides[this.state.currentSide].push(object);
    this.notify();
  }

  updateObject(objectId: string, updates: Partial<KonvaObject>) {
    this.saveStateToHistory();
    const objects = this.state.sides[this.state.currentSide];
    const index = objects.findIndex((o) => o.id === objectId);
    if (index !== -1) {
      objects[index] = { ...objects[index], ...updates };
      this.notify();
    }
  }

  removeObject(objectId: string) {
    this.saveStateToHistory();
    this.state.sides[this.state.currentSide] = this.state.sides[this.state.currentSide].filter(
      (o) => o.id !== objectId
    );
    if (this.state.selectedObjectId === objectId) {
      this.state.selectedObjectId = null;
    }
    this.notify();
  }

  // Selection
  setSelectedObject(objectId: string | null) {
    this.state.selectedObjectId = objectId;
    this.notify();
  }

  // Side switching
  setCurrentSide(side: 'front' | 'inside' | 'back') {
    this.state.currentSide = side;
    this.state.selectedObjectId = null;
    this.notify();
  }

  // Print spec
  setPrintSpec(printSpecId: string) {
    this.state.printSpecId = printSpecId;
    this.state.currentSide = 'front';
    this.notify();
  }

  // UI toggles
  setShowBleed(show: boolean) {
    this.state.showBleed = show;
    this.notify();
  }

  setShowTrim(show: boolean) {
    this.state.showTrim = show;
    this.notify();
  }

  setShowSafe(show: boolean) {
    this.state.showSafe = show;
    this.notify();
  }

  // Undo/Redo
  private saveStateToHistory() {
    // Only save if state has changed
    const currentState = JSON.stringify(this.state.sides);
    const lastState = this.state.history[this.state.historyIndex];
    if (lastState && JSON.stringify(lastState.sides) === currentState) {
      return; // No change
    }

    // Remove any future history
    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    
    // Save current state
    this.state.history.push(JSON.parse(JSON.stringify(this.state)));
    this.state.historyIndex = this.state.history.length - 1;

    // Limit history size
    if (this.state.history.length > 50) {
      this.state.history.shift();
      this.state.historyIndex--;
    }
  }

  undo() {
    if (this.state.historyIndex > 0) {
      this.state.historyIndex--;
      this.state = JSON.parse(JSON.stringify(this.state.history[this.state.historyIndex]));
      this.notify();
    }
  }

  redo() {
    if (this.state.historyIndex < this.state.history.length - 1) {
      this.state.historyIndex++;
      this.state = JSON.parse(JSON.stringify(this.state.history[this.state.historyIndex]));
      this.notify();
    }
  }

  canUndo(): boolean {
    return this.state.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.state.historyIndex < this.state.history.length - 1;
  }

  // Cleanup
  cleanup() {
    this.state.assets.forEach((asset) => {
      if (asset.objectUrl) {
        URL.revokeObjectURL(asset.objectUrl);
      }
    });
  }
}

// Singleton instance
export const projectEditorStore = new ProjectEditorStore();

