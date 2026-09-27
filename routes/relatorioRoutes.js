const express = require('express');
const OrdemController = require('../controllers/ordemController');

module.exports = class RelatorioRoutes {
    constructor() {
        this._router = express.Router();
        this._ordemController = new OrdemController();

        this.configurarRotas();
    }

    configurarRotas = () => {
        this._router.get('/ordens', this._ordemController.Ordem_relatorio_controller);
    };

    get router() {
        return this._router;
    }
};