const Ordem = require('../models/Ordem');

// Campos que o POST exige. No PUT a atualizacao e parcial: os campos ausentes
// mantem o valor que ja esta gravado, por isso a presenca nao e cobrada la.
const CAMPOS_OBRIGATORIOS = [
    { nome: 'codigoOrdem', rotulo: 'O código da ordem é obrigatório' },
    { nome: 'codigoProduto', rotulo: 'O código do produto é obrigatório' },
    { nome: 'tipoProduto', rotulo: 'O tipo do produto é obrigatório' },
    { nome: 'quantidadeProduzida', rotulo: 'A quantidade produzida é obrigatória' },
    { nome: 'custoUnitarioBase', rotulo: 'O custo unitário base é obrigatório' },
    { nome: 'estoqueInicial', rotulo: 'O estoque inicial é obrigatório' }
];

// Um campo nao enviado nao e invalido: no PUT ele apenas nao sera alterado
function naoEnviado(valor) {
    return valor === undefined || valor === null;
}

module.exports = class OrdemMiddleware {

    validar_camposObrigatorios = (request, response, next) => {
        for (let i = 0; i < CAMPOS_OBRIGATORIOS.length; i++) {
            const campo = CAMPOS_OBRIGATORIOS[i];

            if (naoEnviado(request.body[campo.nome])) {
                return response.status(400).send({
                    status: false,
                    error: campo.rotulo
                });
            }
        }

        next();
    }

    validar_codigoOrdem = (request, response, next) => {
        const codigoOrdem = request.body.codigoOrdem;

        if (naoEnviado(codigoOrdem)) {
            return next();
        }

        if (codigoOrdem.toString().trim() === '') {
            return response.status(400).send({
                status: false,
                error: 'O código da ordem é obrigatório'
            });
        }

        next();
    }

    validar_codigoOrdemUnico = async (request, response, next) => {
        const codigoOrdem = request.body.codigoOrdem;

        if (naoEnviado(codigoOrdem)) {
            return next();
        }

        try {
            const ordemExistente = await Ordem.readByCodigoOrdem(codigoOrdem);

            if (ordemExistente) {
                return response.status(400).send({
                    status: false,
                    error: `Já existe uma ordem cadastrada com o código ${codigoOrdem}`
                });
            }

            next();
        } catch (error) {
            console.error('Erro ao validar unicidade da ordem:', error);
            return response.status(500).send({
                status: false,
                error: 'Erro ao validar o código da ordem'
            });
        }
    }

    validar_codigoProduto = (request, response, next) => {
        const codigoProduto = request.body.codigoProduto;

        if (naoEnviado(codigoProduto)) {
            return next();
        }

        if (codigoProduto.toString().trim() === '') {
            return response.status(400).send({
                status: false,
                error: 'O código do produto é obrigatório'
            });
        }

        next();
    }

    validar_tipoProduto = (request, response, next) => {
        if (naoEnviado(request.body.tipoProduto)) {
            return next();
        }

        const tipoProduto = Number(request.body.tipoProduto);

        let valido;
        switch (tipoProduto) {
            case 1:
            case 2:
            case 3:
                valido = true;
                break;
            default:
                valido = false;
        }

        if (!valido) {
            return response.status(400).send({
                status: false,
                error: 'Tipo de produto inválido. Use 1 (Padrão), 2 (Premium) ou 3 (Sob encomenda)'
            });
        }

        next();
    }

    validar_quantidadeProduzida = (request, response, next) => {
        if (naoEnviado(request.body.quantidadeProduzida)) {
            return next();
        }

        const quantidadeProduzida = Number(request.body.quantidadeProduzida);

        if (isNaN(quantidadeProduzida)) {
            return response.status(400).send({
                status: false,
                error: 'A quantidade produzida deve ser um número'
            });
        }

        if (quantidadeProduzida < 0) {
            return response.status(400).send({
                status: false,
                error: 'A quantidade produzida não pode ser negativa'
            });
        }

        next();
    }

    validar_custoUnitarioBase = (request, response, next) => {
        if (naoEnviado(request.body.custoUnitarioBase)) {
            return next();
        }

        const custoUnitarioBase = Number(request.body.custoUnitarioBase);

        if (isNaN(custoUnitarioBase)) {
            return response.status(400).send({
                status: false,
                error: 'O custo unitário base deve ser um número'
            });
        }

        if (custoUnitarioBase <= 0) {
            return response.status(400).send({
                status: false,
                error: 'O custo unitário base deve ser maior que zero'
            });
        }

        next();
    }

    validar_estoqueInicial = (request, response, next) => {
        if (naoEnviado(request.body.estoqueInicial)) {
            return next();
        }

        const estoqueInicial = Number(request.body.estoqueInicial);

        if (isNaN(estoqueInicial)) {
            return response.status(400).send({
                status: false,
                error: 'O estoque inicial deve ser um número'
            });
        }

        if (estoqueInicial < 0) {
            return response.status(400).send({
                status: false,
                error: 'O estoque inicial não pode ser negativo'
            });
        }

        next();
    }
}