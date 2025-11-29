/**
 * Module Loader - Handles dynamic module loading and unloading
 */

import { ModuleRegistry } from './ModuleRegistry';

export class ModuleLoader {
  private loadedScripts: Map<string, HTMLScriptElement> = new Map();
  private loadedStyles: Map<string, HTMLLinkElement> = new Map();

  constructor(private registry: ModuleRegistry) {}

  /**
   * Load a module and its assets
   */
  async load(moduleId: string): Promise<void> {
    const instance = this.registry.getModule(moduleId);
    if (!instance) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    const { manifest } = instance;

    // Load assets
    if (manifest.assets) {
      await this.loadAssets(moduleId, manifest.assets);
    }

    // Execute onLoad hook
    if (manifest.hooks?.onLoad) {
      await manifest.hooks.onLoad();
    }

    console.log(`Module loaded: ${moduleId}`);
  }

  /**
   * Unload a module and cleanup assets
   */
  async unload(moduleId: string): Promise<void> {
    const instance = this.registry.getModule(moduleId);
    if (!instance) {
      return;
    }

    const { manifest } = instance;

    // Execute onUnload hook
    if (manifest.hooks?.onUnload) {
      await manifest.hooks.onUnload();
    }

    // Unload assets
    await this.unloadAssets(moduleId);

    console.log(`Module unloaded: ${moduleId}`);
  }

  /**
   * Load module assets (styles, scripts, etc.)
   */
  private async loadAssets(
    moduleId: string,
    assets: NonNullable<import('./types').ModuleAssets>
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    // Load styles
    if (assets.styles && assets.styles.length > 0) {
      for (const styleUrl of assets.styles) {
        promises.push(this.loadStyle(moduleId, styleUrl));
      }
    }

    // Load scripts
    if (assets.scripts && assets.scripts.length > 0) {
      // Scripts must be loaded sequentially
      for (const scriptUrl of assets.scripts) {
        await this.loadScript(moduleId, scriptUrl);
      }
    }

    // Load fonts
    if (assets.fonts && assets.fonts.length > 0) {
      for (const fontUrl of assets.fonts) {
        promises.push(this.loadFont(fontUrl));
      }
    }

    await Promise.all(promises);
  }

  /**
   * Load a stylesheet
   */
  private loadStyle(moduleId: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const key = `${moduleId}:${url}`;

      // Check if already loaded
      if (this.loadedStyles.has(key)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.setAttribute('data-module-id', moduleId);

      link.onload = () => {
        this.loadedStyles.set(key, link);
        resolve();
      };

      link.onerror = () => {
        reject(new Error(`Failed to load stylesheet: ${url}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Load a script
   */
  private loadScript(moduleId: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const key = `${moduleId}:${url}`;

      // Check if already loaded
      if (this.loadedScripts.has(key)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.async = false; // Preserve execution order
      script.setAttribute('data-module-id', moduleId);

      script.onload = () => {
        this.loadedScripts.set(key, script);
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${url}`));
      };

      document.body.appendChild(script);
    });
  }

  /**
   * Load a font
   */
  private loadFont(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load font: ${url}`));

      document.head.appendChild(link);
    });
  }

  /**
   * Unload module assets
   */
  private async unloadAssets(moduleId: string): Promise<void> {
    // Remove scripts
    for (const [key, script] of this.loadedScripts.entries()) {
      if (key.startsWith(`${moduleId}:`)) {
        script.remove();
        this.loadedScripts.delete(key);
      }
    }

    // Remove styles
    for (const [key, link] of this.loadedStyles.entries()) {
      if (key.startsWith(`${moduleId}:`)) {
        link.remove();
        this.loadedStyles.delete(key);
      }
    }
  }

  /**
   * Hot reload a module
   */
  async hotReload(moduleId: string): Promise<void> {
    console.log(`Hot reloading module: ${moduleId}`);

    const instance = this.registry.getModule(moduleId);
    if (!instance) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    // Unload assets
    await this.unloadAssets(moduleId);

    // Reload assets
    if (instance.manifest.assets) {
      await this.loadAssets(moduleId, instance.manifest.assets);
    }

    // Execute onLoad hook
    if (instance.manifest.hooks?.onLoad) {
      await instance.manifest.hooks.onLoad();
    }

    console.log(`Module hot reloaded: ${moduleId}`);
  }
}
