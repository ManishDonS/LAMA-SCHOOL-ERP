/**
 * Environment Configuration Validator
 *
 * This utility ensures all required environment variables are set
 * and throws an error if any are missing (no hardcoded fallbacks)
 */

const REQUIRED_ENV_VARS = {
  // Critical security variables - NO FALLBACKS
  JWT_SECRET: {
    description: 'JWT secret key for token signing',
    production: true,
  },

  // Database variables
  DB_HOST: {
    description: 'PostgreSQL host',
    defaultValue: 'localhost',
  },
  DB_PORT: {
    description: 'PostgreSQL port',
    defaultValue: '5432',
  },
  DB_NAME: {
    description: 'PostgreSQL database name',
    defaultValue: 'school_erp',
  },
  DB_USER: {
    description: 'PostgreSQL username',
    defaultValue: 'postgres',
  },
  DB_PASSWORD: {
    description: 'PostgreSQL password',
    production: true,
  },

  // Node environment
  NODE_ENV: {
    description: 'Application environment (development, staging, production)',
    defaultValue: 'development',
  },

  // Service communication
  DOCKER: {
    description: 'Whether running in Docker (true/false)',
    defaultValue: 'false',
  },
};

/**
 * Validate environment configuration
 * @param {boolean} isProduction - Whether running in production
 * @throws {Error} If required variables are missing
 */
function validateConfiguration(isProduction = false) {
  const errors = [];
  const warnings = [];
  const config = {};

  for (const [key, meta] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];

    // Check if value is provided
    if (!value) {
      // Variables marked as production-critical must always be set
      if (meta.production) {
        errors.push(
          `CRITICAL: Environment variable '${key}' is required and has no fallback.\n` +
          `Description: ${meta.description}\n` +
          `Please set this variable before starting the application.`
        );
      } else if (meta.defaultValue !== undefined) {
        // Use default if no error required
        warnings.push(
          `Using default value for '${key}': ${meta.defaultValue}`
        );
        config[key] = meta.defaultValue;
      } else {
        errors.push(
          `Missing required environment variable: '${key}'\n` +
          `Description: ${meta.description}`
        );
      }
    } else {
      config[key] = value;
    }
  }

  // If there are errors, throw immediately
  if (errors.length > 0) {
    const errorMessage = [
      '\n',
      '═'.repeat(70),
      'ENVIRONMENT CONFIGURATION ERRORS',
      '═'.repeat(70),
      '',
      errors.join('\n\n'),
      '',
      'To fix:',
      '1. Copy .env.example to .env',
      '2. Update all required values in .env',
      '3. Restart the application',
      '',
      '═'.repeat(70),
      '',
    ].join('\n');

    console.error(errorMessage);
    throw new Error('Invalid environment configuration');
  }

  // Log warnings if any
  if (warnings.length > 0) {
    console.warn(
      '\nConfiguration Warnings:\n' + warnings.map(w => `  ⚠️  ${w}`).join('\n') + '\n'
    );
  }

  // Log success
  console.log(
    `✓ Environment configuration validated successfully ` +
    `(${Object.keys(config).length} variables)`
  );

  return config;
}

module.exports = {
  validateConfiguration,
  REQUIRED_ENV_VARS,
};
