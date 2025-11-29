/**
 * Module Marketplace - Discover and install modules from marketplace
 */

import { ModuleManifest, MarketplaceModule, MarketplaceFilter } from './types';
import { moduleRegistry } from './ModuleRegistry';

export class ModuleMarketplace {
  private static instance: ModuleMarketplace;
  private apiBaseUrl: string = '/api/marketplace'; // Configure based on your API
  private cache: Map<string, MarketplaceModule[]> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): ModuleMarketplace {
    if (!ModuleMarketplace.instance) {
      ModuleMarketplace.instance = new ModuleMarketplace();
    }
    return ModuleMarketplace.instance;
  }

  /**
   * Search marketplace modules
   */
  async search(filter?: MarketplaceFilter): Promise<MarketplaceModule[]> {
    const cacheKey = JSON.stringify(filter || {});

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return cached;
    }

    try {
      // In production, this would call your marketplace API
      // For now, return mock data
      const modules = await this.fetchFromAPI(filter);

      // Cache results
      this.cache.set(cacheKey, modules);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheExpiry);

      return modules;
    } catch (error) {
      console.error('Failed to search marketplace:', error);
      throw error;
    }
  }

  /**
   * Get module details
   */
  async getModule(moduleId: string): Promise<MarketplaceModule | null> {
    try {
      // In production, fetch from API
      const response = await fetch(`${this.apiBaseUrl}/modules/${moduleId}`);
      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('Failed to get module details:', error);
      return null;
    }
  }

  /**
   * Download and install a module from marketplace
   */
  async install(moduleId: string): Promise<void> {
    try {
      // Get module details
      const marketplaceModule = await this.getModule(moduleId);
      if (!marketplaceModule) {
        throw new Error(`Module not found in marketplace: ${moduleId}`);
      }

      // Download module
      console.log(`Downloading module: ${moduleId}`);
      const moduleCode = await this.download(marketplaceModule.downloadUrl);

      // Create dynamic loader
      const loader = () => {
        return new Promise((resolve) => {
          // In a real implementation, you would:
          // 1. Download the module bundle
          // 2. Validate it
          // 3. Load it dynamically
          // 4. Return the module exports

          // For now, we'll simulate it
          resolve({
            manifest: marketplaceModule.manifest,
            // ... module exports
          });
        });
      };

      // Register module
      await moduleRegistry.register(marketplaceModule.manifest, loader);

      // Install module
      await moduleRegistry.install(moduleId);

      console.log(`Module installed from marketplace: ${moduleId}`);
    } catch (error) {
      console.error('Failed to install module from marketplace:', error);
      throw error;
    }
  }

  /**
   * Download module code
   */
  private async download(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Failed to download module:', error);
      throw error;
    }
  }

  /**
   * Fetch modules from API
   */
  private async fetchFromAPI(filter?: MarketplaceFilter): Promise<MarketplaceModule[]> {
    try {
      const params = new URLSearchParams();

      if (filter) {
        if (filter.category) params.append('category', filter.category);
        if (filter.search) params.append('search', filter.search);
        if (filter.tags) params.append('tags', filter.tags.join(','));
        if (filter.verified !== undefined) params.append('verified', String(filter.verified));
        if (filter.sortBy) params.append('sortBy', filter.sortBy);
        if (filter.priceMin !== undefined) params.append('priceMin', String(filter.priceMin));
        if (filter.priceMax !== undefined) params.append('priceMax', String(filter.priceMax));
      }

      const url = `${this.apiBaseUrl}/modules?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        // Return mock data for development
        return this.getMockData(filter);
      }

      return await response.json();
    } catch (error) {
      console.error('API fetch failed, using mock data:', error);
      return this.getMockData(filter);
    }
  }

  /**
   * Get mock marketplace data for development
   */
  private getMockData(filter?: MarketplaceFilter): MarketplaceModule[] {
    const mockModules: MarketplaceModule[] = [
      {
        manifest: {
          id: 'advanced-attendance',
          name: 'Advanced Attendance Tracker',
          version: '2.1.0',
          description: 'Advanced attendance tracking with biometric integration and real-time analytics',
          author: 'School ERP Team',
          license: 'MIT',
          category: 'academic',
          tags: ['attendance', 'biometric', 'analytics'],
          features: [
            {
              id: 'biometric',
              name: 'Biometric Integration',
              description: 'Support for fingerprint and face recognition',
              enabled: true,
            },
            {
              id: 'realtime',
              name: 'Real-time Tracking',
              description: 'Live attendance updates',
              enabled: true,
            },
          ],
          permissions: [
            {
              id: 'attendance.read',
              name: 'Read Attendance',
              description: 'View attendance records',
              category: 'attendance',
            },
            {
              id: 'attendance.write',
              name: 'Write Attendance',
              description: 'Mark attendance',
              category: 'attendance',
            },
          ],
        },
        downloads: 15420,
        rating: 4.8,
        reviews: 234,
        publishedAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-12-01'),
        verified: true,
        price: 0,
        downloadUrl: 'https://marketplace.school-erp.com/modules/advanced-attendance.tar.gz',
      },
      {
        manifest: {
          id: 'smart-scheduling',
          name: 'Smart Class Scheduling',
          version: '1.5.2',
          description: 'AI-powered class scheduling with conflict resolution and optimization',
          author: 'EdTech Solutions',
          license: 'Commercial',
          category: 'academic',
          tags: ['scheduling', 'ai', 'optimization'],
          features: [
            {
              id: 'ai-optimization',
              name: 'AI Optimization',
              description: 'Automatic schedule optimization',
              enabled: true,
            },
            {
              id: 'conflict-detection',
              name: 'Conflict Detection',
              description: 'Detect and resolve scheduling conflicts',
              enabled: true,
            },
          ],
          permissions: [],
        },
        downloads: 8932,
        rating: 4.6,
        reviews: 156,
        publishedAt: new Date('2024-03-20'),
        updatedAt: new Date('2024-11-15'),
        verified: true,
        price: 99.99,
        downloadUrl: 'https://marketplace.school-erp.com/modules/smart-scheduling.tar.gz',
      },
      {
        manifest: {
          id: 'parent-portal',
          name: 'Enhanced Parent Portal',
          version: '3.0.1',
          description: 'Modern parent portal with mobile app integration and push notifications',
          author: 'Parent Connect Inc',
          license: 'MIT',
          category: 'communication',
          tags: ['parent', 'communication', 'mobile'],
          features: [
            {
              id: 'mobile-app',
              name: 'Mobile App',
              description: 'iOS and Android apps',
              enabled: true,
            },
            {
              id: 'push-notifications',
              name: 'Push Notifications',
              description: 'Real-time notifications',
              enabled: true,
            },
          ],
          permissions: [],
        },
        downloads: 12567,
        rating: 4.9,
        reviews: 412,
        publishedAt: new Date('2023-11-10'),
        updatedAt: new Date('2024-12-05'),
        verified: true,
        price: 0,
        downloadUrl: 'https://marketplace.school-erp.com/modules/parent-portal.tar.gz',
      },
      {
        manifest: {
          id: 'fee-management-pro',
          name: 'Fee Management Pro',
          version: '2.3.0',
          description: 'Comprehensive fee management with payment gateway integration and reminders',
          author: 'FinEdu Systems',
          license: 'Commercial',
          category: 'finance',
          tags: ['fee', 'payment', 'finance'],
          features: [
            {
              id: 'payment-gateway',
              name: 'Payment Gateway',
              description: 'Multiple payment gateway support',
              enabled: true,
            },
            {
              id: 'auto-reminders',
              name: 'Auto Reminders',
              description: 'Automated payment reminders',
              enabled: true,
            },
          ],
          permissions: [],
        },
        downloads: 9823,
        rating: 4.7,
        reviews: 189,
        publishedAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-11-28'),
        verified: true,
        price: 149.99,
        downloadUrl: 'https://marketplace.school-erp.com/modules/fee-management-pro.tar.gz',
      },
      {
        manifest: {
          id: 'exam-analytics',
          name: 'Exam Analytics Dashboard',
          version: '1.8.4',
          description: 'Advanced analytics and insights for exam performance with AI recommendations',
          author: 'Analytics Pro',
          license: 'MIT',
          category: 'reporting',
          tags: ['exam', 'analytics', 'reporting'],
          features: [
            {
              id: 'ai-insights',
              name: 'AI Insights',
              description: 'AI-powered performance insights',
              enabled: true,
            },
            {
              id: 'custom-reports',
              name: 'Custom Reports',
              description: 'Create custom report templates',
              enabled: true,
            },
          ],
          permissions: [],
        },
        downloads: 6745,
        rating: 4.5,
        reviews: 98,
        publishedAt: new Date('2024-04-12'),
        updatedAt: new Date('2024-11-20'),
        verified: false,
        price: 0,
        downloadUrl: 'https://marketplace.school-erp.com/modules/exam-analytics.tar.gz',
      },
    ];

    // Apply filters
    let filtered = mockModules;

    if (filter) {
      if (filter.category) {
        filtered = filtered.filter((m) => m.manifest.category === filter.category);
      }

      if (filter.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.manifest.name.toLowerCase().includes(search) ||
            m.manifest.description.toLowerCase().includes(search) ||
            m.manifest.tags?.some((t) => t.toLowerCase().includes(search))
        );
      }

      if (filter.tags && filter.tags.length > 0) {
        filtered = filtered.filter((m) =>
          filter.tags!.some((tag) => m.manifest.tags?.includes(tag))
        );
      }

      if (filter.verified !== undefined) {
        filtered = filtered.filter((m) => m.verified === filter.verified);
      }

      if (filter.priceMin !== undefined) {
        filtered = filtered.filter((m) => m.price >= filter.priceMin!);
      }

      if (filter.priceMax !== undefined) {
        filtered = filtered.filter((m) => m.price <= filter.priceMax!);
      }

      // Sort
      if (filter.sortBy) {
        switch (filter.sortBy) {
          case 'downloads':
            filtered.sort((a, b) => b.downloads - a.downloads);
            break;
          case 'rating':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
          case 'recent':
            filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            break;
          case 'name':
            filtered.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
            break;
        }
      }
    }

    return filtered;
  }

  /**
   * Submit a module to marketplace
   */
  async submit(manifest: ModuleManifest, packageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manifest,
          packageUrl,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to submit module:', error);
      return false;
    }
  }

  /**
   * Get featured modules
   */
  async getFeatured(): Promise<MarketplaceModule[]> {
    return this.search({ verified: true, sortBy: 'downloads' });
  }

  /**
   * Get popular modules
   */
  async getPopular(): Promise<MarketplaceModule[]> {
    return this.search({ sortBy: 'downloads' });
  }

  /**
   * Get recent modules
   */
  async getRecent(): Promise<MarketplaceModule[]> {
    return this.search({ sortBy: 'recent' });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Configure API base URL
   */
  setApiBaseUrl(url: string): void {
    this.apiBaseUrl = url;
  }
}

// Export singleton
export const moduleMarketplace = ModuleMarketplace.getInstance();
