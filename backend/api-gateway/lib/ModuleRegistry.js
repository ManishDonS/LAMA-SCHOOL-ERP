const { Pool } = require('pg');

class ModuleRegistry {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'postgres',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'school_erp',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
    this.modules = new Map();
    this.refreshInterval = 30000; // 30 seconds
  }

  async init() {
    await this.refreshModules();
    setInterval(() => this.refreshModules(), this.refreshInterval);
  }

  async refreshModules() {
    try {
      const result = await this.pool.query(
        "SELECT * FROM system_modules WHERE status = 'active'"
      );

      const newModules = new Map();
      for (const row of result.rows) {
        newModules.set(row.name, {
          url: row.url,
          routes: row.routes || [],
          version: row.version
        });
      }

      this.modules = newModules;
      console.log(`Refreshed module registry: ${this.modules.size} active modules`);
    } catch (error) {
      console.error('Failed to refresh module registry:', error);
    }
  }

  getModule(name) {
    return this.modules.get(name);
  }

  getAllModules() {
    return Array.from(this.modules.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  async registerModule(manifest, url) {
    const { id, name, version, routes } = manifest;

    const query = `
      INSERT INTO system_modules (name, version, url, routes, manifest, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (name) 
      DO UPDATE SET 
        version = EXCLUDED.version,
        url = EXCLUDED.url,
        routes = EXCLUDED.routes,
        manifest = EXCLUDED.manifest,
        status = 'active',
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [
        id || name, // Use ID if available, else name
        version,
        url,
        JSON.stringify(routes || []),
        JSON.stringify(manifest)
      ]);

      await this.refreshModules();
      return result.rows[0];
    } catch (error) {
      console.error(`Failed to register module ${name}:`, error);
      throw error;
    }
  }

  async listAllModules() {
    try {
      const result = await this.pool.query("SELECT * FROM system_modules ORDER BY name");
      return result.rows;
    } catch (error) {
      console.error('Failed to list modules:', error);
      throw error;
    }
  }

  async toggleModuleStatus(name, status) {
    if (!['active', 'inactive'].includes(status)) {
      throw new Error('Invalid status. Must be active or inactive');
    }

    try {
      const result = await this.pool.query(
        "UPDATE system_modules SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE name = $2 RETURNING *",
        [status, name]
      );

      if (result.rowCount === 0) {
        throw new Error(`Module ${name} not found`);
      }

      await this.refreshModules();
      return result.rows[0];
    } catch (error) {
      console.error(`Failed to toggle module ${name}:`, error);
      throw error;
    }
  }
}

module.exports = new ModuleRegistry();
