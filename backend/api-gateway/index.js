const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const { validateConfiguration } = require('../shared/config/validator');
const moduleRegistry = require('./lib/ModuleRegistry');

// Validate environment configuration at startup
const config = validateConfiguration(process.env.NODE_ENV === 'production');

const app = express();
const PORT = process.env.GATEWAY_PORT || 8080;

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'API Gateway is running',
    timestamp: new Date().toISOString(),
    modules: moduleRegistry.getAllModules().length
  });
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Skip auth for public endpoints
  const publicEndpoints = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/modules/register', // Allow modules to register themselves
    '/api/v1/modules' // Allow listing modules publicly
  ];

  // Check if this is a public endpoint (any method)
  if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }

  // Check for login/register POST
  if (req.method === 'POST' && (req.path === '/api/v1/auth/login' || req.path === '/api/v1/auth/register')) {
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET environment variable not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.use(authenticateToken);

// Module Registration Endpoint
app.post('/api/v1/modules/register', async (req, res) => {
  try {
    const { manifest, url } = req.body;
    if (!manifest || !url) {
      return res.status(400).json({ error: 'Manifest and URL are required' });
    }

    const module = await moduleRegistry.registerModule(manifest, url);
    res.json({ status: 'registered', module });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Module Management Endpoints
const moduleController = require('./controllers/ModuleController');
app.get('/api/v1/modules', moduleController.listModules);
app.post('/api/v1/modules/:id/install', moduleController.installModule);
app.post('/api/v1/modules/:id/uninstall', moduleController.uninstallModule);

// Dynamic Routing Middleware
app.use('/api/v1', async (req, res, next) => {
  const path = req.path;
  console.log(`[Gateway] Incoming request: ${req.method} ${path}`);

  // Find module that handles this path
  const modules = moduleRegistry.getAllModules();
  console.log(`[Gateway] Active modules:`, modules.map(m => ({ name: m.name, routes: m.routes })));

  for (const mod of modules) {
    if (mod.routes && Array.isArray(mod.routes)) {
      for (const route of mod.routes) {
        // Simple prefix match for now. Can be enhanced with regex.
        // Route definition example: { "path": "/students", "method": "ALL" }
        if (path.startsWith(route.path)) {
          console.log(`[Gateway] Matched route ${route.path} for module ${mod.name}, proxying to ${mod.url}`);

          // Use http-proxy-middleware but with simpler config
          const proxy = createProxyMiddleware({
            target: mod.url,
            changeOrigin: false,
            pathRewrite: {
              '^/api/v1': ''
            },
            onProxyReq: (proxyReq, req, res) => {
              console.log(`[Gateway] Proxying ${req.method} ${proxyReq.path} to ${mod.url}`);
            },
            onProxyRes: (proxyRes, req, res) => {
              console.log(`[Gateway] Response: ${proxyRes.statusCode}`);
            },
            onError: (err, req, res) => {
              console.error(`[Gateway] Proxy error:`, err.message);
              if (!res.headersSent) {
                res.status(503).json({ error: 'Service unavailable' });
              }
            }
          });

          return proxy(req, res, next);
        }
      }
    }
  }

  // Fallback for hardcoded auth (if not yet modularized)
  // This part remains as a fallback, but ideally auth would also be a registered module.
  if (path.startsWith('/auth')) {
    const proxy = createProxyMiddleware({
      target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      changeOrigin: true,
      onError: (err, req, res) => res.status(503).json({ error: 'Auth service unavailable' })
    });
    return proxy(req, res, next);
  }

  next();
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize Module Registry
  await moduleRegistry.init();
});

module.exports = app;
