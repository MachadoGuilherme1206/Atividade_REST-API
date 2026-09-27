const express = require('express');
const OrdemRoutes = require('./routes/ordemRoutes');
const RelatorioRoutes = require('./routes/relatorioRoutes');

module.exports = class Servidor {
  constructor() {
    this._app = express();
    this._porta = 3000;

    this._app.use(express.json());

    this._ordemRoutes = new OrdemRoutes();
    this._relatorioRoutes = new RelatorioRoutes();

    this.configurarRotas();
  }

  configurarRotas = () => {
    this._app.use('/ordens', this._ordemRoutes.router);
    this._app.use('/relatorios', this._relatorioRoutes.router);
  };

  iniciar = () => {
    this._app.listen(this._porta, () => {
      console.log(`Servidor rodando na porta ${this._porta}`);
    });
  };
};