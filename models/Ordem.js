const Banco = require('./Banco');

// O MySQL devolve colunas DECIMAL como string; esta funcao garante que os
// campos numericos voltem para o cliente como numero, e nao como texto.
function formatarLinha(linha) {
    if (!linha) {
        return null;
    }
    return {
        codigoOrdem: linha.codigoOrdem,
        codigoProduto: linha.codigoProduto,
        tipoProduto: Number(linha.tipoProduto),
        quantidadeProduzida: Number(linha.quantidadeProduzida),
        custoUnitarioBase: Number(linha.custoUnitarioBase),
        estoqueInicial: Number(linha.estoqueInicial),
        custoUnitarioAjustado: Number(linha.custoUnitarioAjustado),
        estoqueFinal: Number(linha.estoqueFinal),
        custoTotal: Number(linha.custoTotal),
        alertaEstoque: linha.alertaEstoque
    };
}

module.exports = class Ordem {
    constructor() {
        this._codigoOrdem = null;
        this._codigoProduto = null;
        this._tipoProduto = null;
        this._quantidadeProduzida = null;
        this._custoUnitarioBase = null;
        this._estoqueInicial = null;
        this._custoUnitarioAjustado = null;
        this._estoqueFinal = null;
        this._custoTotal = null;
        this._alertaEstoque = null;
    }

    // Sem isso o JSON.stringify da resposta exporia os atributos privados
    // (_codigoOrdem, _custoTotal...) em vez dos nomes esperados pela API
    toJSON() {
        return {
            codigoOrdem: this.codigoOrdem,
            codigoProduto: this.codigoProduto,
            tipoProduto: Number(this.tipoProduto),
            quantidadeProduzida: Number(this.quantidadeProduzida),
            custoUnitarioBase: Number(this.custoUnitarioBase),
            estoqueInicial: Number(this.estoqueInicial),
            custoUnitarioAjustado: Number(this.custoUnitarioAjustado),
            estoqueFinal: Number(this.estoqueFinal),
            custoTotal: Number(this.custoTotal),
            alertaEstoque: this.alertaEstoque
        };
    }

    async create() {
        const query = `
            INSERT INTO ordens
                (codigoOrdem, codigoProduto, tipoProduto, quantidadeProduzida, custoUnitarioBase, estoqueInicial,
                 custoUnitarioAjustado, estoqueFinal, custoTotal, alertaEstoque)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        try {
            const conexao = Banco.getConexao();
            const values = [
                this.codigoOrdem,
                this.codigoProduto,
                this.tipoProduto,
                this.quantidadeProduzida,
                this.custoUnitarioBase,
                this.estoqueInicial,
                this.custoUnitarioAjustado,
                this.estoqueFinal,
                this.custoTotal,
                this.alertaEstoque
            ];
            const [resposta] = await conexao.promise().execute(query, values);
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao criar ordem:', error);
            return false;
        }
    }

    static async readAll(filtros = {}) {
        let query = 'SELECT * FROM ordens WHERE 1=1';
        const values = [];

        if (filtros.tipoProduto) {
            query += ' AND tipoProduto = ?';
            values.push(Number(filtros.tipoProduto));
        }
        if (filtros.alertaEstoque) {
            // aceita ?alerta=alto, Alto ou ALTO
            query += ' AND alertaEstoque = ?';
            values.push(filtros.alertaEstoque.toString().trim().toUpperCase());
        }

        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, values);
            return resposta.map(formatarLinha);
        } catch (error) {
            console.error('Erro ao buscar todas as ordens:', error);
            return [];
        }
    }

    static async readByCodigoOrdem(codigoOrdem) {
        const query = 'SELECT * FROM ordens WHERE codigoOrdem = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [codigoOrdem]);
            return formatarLinha(resposta[0]);
        } catch (error) {
            console.error('Erro ao buscar a ordem:', error);
            return null;
        }
    }

    async update() {
        const query = `
            UPDATE ordens
            SET codigoProduto = ?, tipoProduto = ?, quantidadeProduzida = ?, custoUnitarioBase = ?, estoqueInicial = ?,
                custoUnitarioAjustado = ?, estoqueFinal = ?, custoTotal = ?, alertaEstoque = ?
            WHERE codigoOrdem = ?
        `;
        try {
            const conexao = Banco.getConexao();
            const values = [
                this.codigoProduto,
                this.tipoProduto,
                this.quantidadeProduzida,
                this.custoUnitarioBase,
                this.estoqueInicial,
                this.custoUnitarioAjustado,
                this.estoqueFinal,
                this.custoTotal,
                this.alertaEstoque,
                this.codigoOrdem
            ];
            await conexao.promise().execute(query, values);
            // O MySQL reporta affectedRows = 0 quando os valores enviados sao iguais
            // aos que ja estavam gravados. Como o controller ja confirmou que a ordem
            // existe, chegar aqui sem excecao significa que o UPDATE foi aplicado.
            return true;
        } catch (error) {
            console.error('Erro ao atualizar ordem:', error);
            return false;
        }
    }

    async delete() {
        const query = 'DELETE FROM ordens WHERE codigoOrdem = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [this.codigoOrdem]);
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao deletar ordem:', error);
            return false;
        }
    }

    get codigoOrdem() {
        return this._codigoOrdem;
    }
    set codigoOrdem(codigoOrdem) {
        this._codigoOrdem = codigoOrdem;
    }

    get codigoProduto() {
        return this._codigoProduto;
    }
    set codigoProduto(codigoProduto) {
        this._codigoProduto = codigoProduto;
    }

    get tipoProduto() {
        return this._tipoProduto;
    }
    set tipoProduto(tipoProduto) {
        this._tipoProduto = tipoProduto;
    }

    get quantidadeProduzida() {
        return this._quantidadeProduzida;
    }
    set quantidadeProduzida(quantidadeProduzida) {
        this._quantidadeProduzida = quantidadeProduzida;
    }

    get custoUnitarioBase() {
        return this._custoUnitarioBase;
    }
    set custoUnitarioBase(custoUnitarioBase) {
        this._custoUnitarioBase = custoUnitarioBase;
    }

    get estoqueInicial() {
        return this._estoqueInicial;
    }
    set estoqueInicial(estoqueInicial) {
        this._estoqueInicial = estoqueInicial;
    }

    get custoUnitarioAjustado() {
        return this._custoUnitarioAjustado;
    }
    set custoUnitarioAjustado(custoUnitarioAjustado) {
        this._custoUnitarioAjustado = custoUnitarioAjustado;
    }

    get estoqueFinal() {
        return this._estoqueFinal;
    }
    set estoqueFinal(estoqueFinal) {
        this._estoqueFinal = estoqueFinal;
    }

    get custoTotal() {
        return this._custoTotal;
    }
    set custoTotal(custoTotal) {
        this._custoTotal = custoTotal;
    }

    get alertaEstoque() {
        return this._alertaEstoque;
    }
    set alertaEstoque(alertaEstoque) {
        this._alertaEstoque = alertaEstoque;
    }
};