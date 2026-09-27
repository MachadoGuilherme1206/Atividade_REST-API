const Ordem = require('../models/Ordem');

// Valores em dinheiro ficam com 2 casas, igual as colunas DECIMAL do banco.
// Sem isso 80 * 1.10 viraria 88.00000000000001 na resposta da API.
function arredondarDinheiro(valor) {
    return Math.round(valor * 100) / 100;
}

function calcularCustoUnitarioAjustado(tipoProduto, custoUnitarioBase) {
    switch (Number(tipoProduto)) {
        case 2:
            return arredondarDinheiro(custoUnitarioBase * 1.10);
        case 3:
            return arredondarDinheiro(custoUnitarioBase * 1.20);
        case 1:
        default:
            return arredondarDinheiro(custoUnitarioBase);
    }
}

// Usada no PUT: devolve o valor enviado no corpo ou, se ausente, o valor atual
function valorOuAtual(valorEnviado, valorAtual) {
    if (valorEnviado === undefined || valorEnviado === null) {
        return valorAtual;
    }
    return valorEnviado;
}

function calcularAlertaEstoque(estoqueFinal) {
    if (estoqueFinal > 5000) {
        return 'ALTO';
    }
    if (estoqueFinal < 500) {
        return 'CRITICO';
    }
    return 'NORMAL';
}

// Monta o relatório consolidado a partir da lista de ordens já cadastradas
function gerarRelatorioOrdens(ordens) {
    const totalOrdens = ordens.length;

    let estoquePadrao = 0;
    let estoquePremium = 0;
    let estoqueSobEncomenda = 0;
    let somaCustoTotal = 0;

    let ordemMaisCara = null;
    let ordemMaisBarata = null;

    let alertaAlto = 0;
    let alertaCritico = 0;
    let alertaNormal = 0;

    const produtosMap = {};

    for (let i = 0; i < ordens.length; i++) {
        const ordem = ordens[i];
        const custoTotal = Number(ordem.custoTotal);

        switch (Number(ordem.tipoProduto)) {
            case 1:
                estoquePadrao += ordem.estoqueFinal;
                break;
            case 2:
                estoquePremium += ordem.estoqueFinal;
                break;
            case 3:
                estoqueSobEncomenda += ordem.estoqueFinal;
                break;
        }

        somaCustoTotal += custoTotal;

        if (!ordemMaisCara || custoTotal > ordemMaisCara.custoTotal) {
            ordemMaisCara = { codigoOrdem: ordem.codigoOrdem, custoTotal: custoTotal };
        }
        if (!ordemMaisBarata || custoTotal < ordemMaisBarata.custoTotal) {
            ordemMaisBarata = { codigoOrdem: ordem.codigoOrdem, custoTotal: custoTotal };
        }

        switch (ordem.alertaEstoque) {
            case 'ALTO':
                alertaAlto++;
                break;
            case 'CRITICO':
                alertaCritico++;
                break;
            case 'NORMAL':
                alertaNormal++;
                break;
        }

        if (!produtosMap[ordem.codigoProduto]) {
            produtosMap[ordem.codigoProduto] = {
                codigoProduto: ordem.codigoProduto,
                estoqueFinalConsolidado: 0,
                valorTotalInvestido: 0
            };
        }
        produtosMap[ordem.codigoProduto].estoqueFinalConsolidado += ordem.estoqueFinal;
        produtosMap[ordem.codigoProduto].valorTotalInvestido += custoTotal;
    }

    const porProduto = [];
    for (const codigoProduto in produtosMap) {
        const produto = produtosMap[codigoProduto];
        produto.valorTotalInvestido = arredondarDinheiro(produto.valorTotalInvestido);
        porProduto.push(produto);
    }

    return {
        totalOrdens,
        estoquePorTipo: {
            padrao: estoquePadrao,
            premium: estoquePremium,
            sobEncomenda: estoqueSobEncomenda
        },
        mediaCustoTotalPorOrdem: totalOrdens > 0 ? arredondarDinheiro(somaCustoTotal / totalOrdens) : 0,
        ordemMaisCara,
        ordemMaisBarata,
        quantidadeAlertas: {
            alto: alertaAlto,
            critico: alertaCritico,
            normal: alertaNormal
        },
        porProduto
    };
}

module.exports = class OrdemController {
    Ordem_create_controller = async (req, res) => {
        const ordem = new Ordem();
        ordem.codigoOrdem = req.body.codigoOrdem;
        ordem.codigoProduto = req.body.codigoProduto;
        ordem.tipoProduto = req.body.tipoProduto;
        ordem.quantidadeProduzida = Number(req.body.quantidadeProduzida);
        ordem.custoUnitarioBase = Number(req.body.custoUnitarioBase);
        ordem.estoqueInicial = Number(req.body.estoqueInicial);

        // Campos calculados
        ordem.estoqueFinal = ordem.estoqueInicial + ordem.quantidadeProduzida;
        ordem.custoUnitarioAjustado = calcularCustoUnitarioAjustado(ordem.tipoProduto, ordem.custoUnitarioBase);
        ordem.custoTotal = arredondarDinheiro(ordem.quantidadeProduzida * ordem.custoUnitarioAjustado);
        ordem.alertaEstoque = calcularAlertaEstoque(ordem.estoqueFinal);

        const sucesso = await ordem.create();


        if (sucesso) {
            return res.status(201).send({
                status: true,
                message: 'Ordem criada com sucesso',
                ordem
                 
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao criar ordem'
             
        });
    }

    Ordem_readAll_controller = async (req, res) => {
        const filtros = {};
        if (req.query.tipo) {
            filtros.tipoProduto = req.query.tipo;
        }
        if (req.query.alerta) {
            filtros.alertaEstoque = req.query.alerta;
        }

        const ordens = await Ordem.readAll(filtros);


        return res.status(200).send({
            status: true,
            message: 'Ordens encontradas com sucesso',
            ordens
             
        });
    }

    Ordem_readByCodigoOrdem_controller = async (req, res) => {
        const codigoOrdem = req.params.codigoOrdem;
        const ordem = await Ordem.readByCodigoOrdem(codigoOrdem);

        if (ordem) {
            return res.status(200).send({
                status: true,
                message: 'Ordem encontrada com sucesso',
                ordem
                 
            });
        }
        return res.status(404).send({
            status: false,
            message: 'Ordem não encontrada'
             
        });
    }

    Ordem_update_controller = async (req, res) => {
        const codigoOrdem = req.params.codigoOrdem;
        const ordemExistente = await Ordem.readByCodigoOrdem(codigoOrdem);

        // Sem a ordem no banco nao existe o que atualizar: 404, e nao erro de servidor
        if (!ordemExistente) {
            return res.status(404).send({
                status: false,
                message: 'Ordem não encontrada'
            });
        }

        const ordem = new Ordem();
        ordem.codigoOrdem = codigoOrdem;

        // Atualizacao parcial: campo ausente no corpo mantem o valor atual da ordem
        ordem.codigoProduto = valorOuAtual(req.body.codigoProduto, ordemExistente.codigoProduto);
        ordem.tipoProduto = Number(valorOuAtual(req.body.tipoProduto, ordemExistente.tipoProduto));
        ordem.quantidadeProduzida = Number(valorOuAtual(req.body.quantidadeProduzida, ordemExistente.quantidadeProduzida));
        ordem.custoUnitarioBase = Number(valorOuAtual(req.body.custoUnitarioBase, ordemExistente.custoUnitarioBase));
        ordem.estoqueInicial = Number(valorOuAtual(req.body.estoqueInicial, ordemExistente.estoqueInicial));

        // Recalcula os campos derivados após a alteração
        ordem.estoqueFinal = ordem.estoqueInicial + ordem.quantidadeProduzida;
        ordem.custoUnitarioAjustado = calcularCustoUnitarioAjustado(ordem.tipoProduto, ordem.custoUnitarioBase);
        ordem.custoTotal = arredondarDinheiro(ordem.quantidadeProduzida * ordem.custoUnitarioAjustado);
        ordem.alertaEstoque = calcularAlertaEstoque(ordem.estoqueFinal);

        const sucesso = await ordem.update();

        if (sucesso) {
            return res.status(200).send({
                status: true,
                message: 'Ordem atualizada com sucesso',
                ordem
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao atualizar ordem'
        });
    }

    Ordem_delete_controller = async (req, res) => {
        const codigoOrdem = req.params.codigoOrdem;
        const ordemExistente = await Ordem.readByCodigoOrdem(codigoOrdem);

        // Remover algo que nao existe e 404, nao erro de servidor
        if (!ordemExistente) {
            return res.status(404).send({
                status: false,
                message: 'Ordem não encontrada'
            });
        }

        const ordem = new Ordem();
        ordem.codigoOrdem = codigoOrdem;

        const sucesso = await ordem.delete();

        if (sucesso) {
            return res.status(200).send({
                status: true,
                message: 'Ordem deletada com sucesso'
                 
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao deletar ordem'
             
        });
    }

    Ordem_relatorio_controller = async (req, res) => {
        const ordens = await Ordem.readAll();
        const relatorio = gerarRelatorioOrdens(ordens);

        return res.status(200).send({
            status: true,
            message: 'Relatório gerado com sucesso',
            relatorio
        });
    }
};