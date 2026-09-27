const express = require('express');
const OrdemController = require('../controllers/ordemController');
const OrdemMiddleware = require('../middlewares/ordemMiddleware');

module.exports = class OrdemRoutes {
    constructor() {
        this._router = express.Router();
        this._ordemController = new OrdemController();
        this._ordemMiddleware = new OrdemMiddleware();

        this.configurarRotas();
    }

    configurarRotas = () => {
        this._router.post(
            '/',
            this._ordemMiddleware.validar_camposObrigatorios,
            this._ordemMiddleware.validar_codigoOrdem,
            this._ordemMiddleware.validar_codigoOrdemUnico,
            this._ordemMiddleware.validar_codigoProduto,
            this._ordemMiddleware.validar_tipoProduto,
            this._ordemMiddleware.validar_quantidadeProduzida,
            this._ordemMiddleware.validar_custoUnitarioBase,
            this._ordemMiddleware.validar_estoqueInicial,
            this._ordemController.Ordem_create_controller
        );

        this._router.get('/', this._ordemController.Ordem_readAll_controller);

        this._router.get('/:codigoOrdem', this._ordemController.Ordem_readByCodigoOrdem_controller);

        this._router.put(
            '/:codigoOrdem',
            this._ordemMiddleware.validar_codigoProduto,
            this._ordemMiddleware.validar_tipoProduto,
            this._ordemMiddleware.validar_quantidadeProduzida,
            this._ordemMiddleware.validar_custoUnitarioBase,
            this._ordemMiddleware.validar_estoqueInicial,
            this._ordemController.Ordem_update_controller
        );

        this._router.delete('/:codigoOrdem', this._ordemController.Ordem_delete_controller);
    };

    get router() {
        return this._router;
    }
};