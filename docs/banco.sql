CREATE DATABASE IF NOT EXISTS controle_producao
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE controle_producao;

DROP TABLE IF EXISTS ordens;

CREATE TABLE ordens (
  -- Identificador único da ordem (recebido no corpo do POST, não é auto-incremento)
  codigoOrdem            VARCHAR(50)     NOT NULL PRIMARY KEY,

  -- Dados enviados pelo cliente
  codigoProduto          VARCHAR(50)     NOT NULL,
  tipoProduto            TINYINT         NOT NULL,           -- 1=Padrão, 2=Premium, 3=Sob encomenda
  quantidadeProduzida    INT             NOT NULL,
  custoUnitarioBase      DECIMAL(10,2)   NOT NULL,
  estoqueInicial         INT             NOT NULL,

  -- Campos calculados pela API e persistidos aqui
  custoUnitarioAjustado  DECIMAL(10,2)   NOT NULL,
  estoqueFinal           INT             NOT NULL,
  custoTotal             DECIMAL(12,2)   NOT NULL,
  alertaEstoque          ENUM('ALTO','CRITICO','NORMAL') NOT NULL,

  -- Controle
  criadoEm               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  atualizadoEm           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_tipoProduto CHECK (tipoProduto IN (1, 2, 3)),
  CONSTRAINT chk_quantidade CHECK (quantidadeProduzida >= 0),
  CONSTRAINT chk_estoqueInicial CHECK (estoqueInicial >= 0)
);

-- Índices para os filtros usados em GET /ordens?tipo= e GET /ordens?alerta=
CREATE INDEX idx_tipoProduto ON ordens (tipoProduto);
CREATE INDEX idx_alertaEstoque ON ordens (alertaEstoque);
CREATE INDEX idx_codigoProduto ON ordens (codigoProduto);

-- =====================================================================
-- Dados de exemplo (calculados manualmente seguindo as regras de negócio)
-- =====================================================================

INSERT INTO ordens
  (codigoOrdem, codigoProduto, tipoProduto, quantidadeProduzida, custoUnitarioBase, estoqueInicial,
   custoUnitarioAjustado, estoqueFinal, custoTotal, alertaEstoque)
VALUES
  ('OP001', 'PROD-A', 1, 100,  50.00, 200,  50.00,  300,  5000.00,  'CRITICO'),
  ('OP002', 'PROD-B', 2, 3000, 80.00, 3000, 88.00,  6000, 264000.00,'ALTO'),
  ('OP003', 'PROD-C', 3, 50,   200.00,1000, 240.00, 1050, 12000.00, 'NORMAL'),
  ('OP004', 'PROD-A', 1, 10,   50.00, 100,  50.00,  110,  500.00,   'CRITICO');