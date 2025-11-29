const ModuleRegistry = require('../lib/ModuleRegistry');

class ModuleController {
    async listModules(req, res) {
        try {
            const modules = await ModuleRegistry.listAllModules();
            res.json({
                success: true,
                count: modules.length,
                data: modules
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to list modules'
            });
        }
    }

    async installModule(req, res) {
        const { id } = req.params;
        try {
            const module = await ModuleRegistry.toggleModuleStatus(id, 'active');
            res.json({
                success: true,
                message: `Module ${id} installed successfully`,
                data: module
            });
        } catch (error) {
            res.status(error.message.includes('not found') ? 404 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    async uninstallModule(req, res) {
        const { id } = req.params;
        try {
            const module = await ModuleRegistry.toggleModuleStatus(id, 'inactive');
            res.json({
                success: true,
                message: `Module ${id} uninstalled successfully`,
                data: module
            });
        } catch (error) {
            res.status(error.message.includes('not found') ? 404 : 500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new ModuleController();
