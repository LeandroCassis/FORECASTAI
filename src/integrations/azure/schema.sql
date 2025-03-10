-- Script de criação de tabelas para o banco de dados FORECAST

-- Verificando e criando apenas as tabelas que não existem

-- Tabela de produtos (Verificar se existe antes de criar)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'produtos')
BEGIN
    CREATE TABLE produtos (
        codigo varchar(50) PRIMARY KEY,
        produto varchar(100) NOT NULL
    );
    PRINT 'Tabela produtos criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'A tabela produtos já existe.';
END;

-- Adicionando colunas à tabela produtos se não existirem
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'produtos')
BEGIN
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'created_at')
    BEGIN
        ALTER TABLE produtos ADD created_at datetime NULL;
        PRINT 'Coluna created_at adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'data_atualizacao_fob')
    BEGIN
        ALTER TABLE produtos ADD data_atualizacao_fob datetime NULL;
        PRINT 'Coluna data_atualizacao_fob adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'empresa')
    BEGIN
        ALTER TABLE produtos ADD empresa varchar(100) NOT NULL DEFAULT '';
        PRINT 'Coluna empresa adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'estoque')
    BEGIN
        ALTER TABLE produtos ADD estoque decimal(18,2) NULL;
        PRINT 'Coluna estoque adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'fabrica')
    BEGIN
        ALTER TABLE produtos ADD fabrica varchar(100) NOT NULL DEFAULT '';
        PRINT 'Coluna fabrica adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'familia1')
    BEGIN
        ALTER TABLE produtos ADD familia1 varchar(100) NOT NULL DEFAULT '';
        PRINT 'Coluna familia1 adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'familia2')
    BEGIN
        ALTER TABLE produtos ADD familia2 varchar(100) NOT NULL DEFAULT '';
        PRINT 'Coluna familia2 adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'fob')
    BEGIN
        ALTER TABLE produtos ADD fob decimal(18,2) NULL;
        PRINT 'Coluna fob adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'indice')
    BEGIN
        ALTER TABLE produtos ADD indice decimal(18,2) NULL;
        PRINT 'Coluna indice adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'marca')
    BEGIN
        ALTER TABLE produtos ADD marca varchar(100) NOT NULL DEFAULT '';
        PRINT 'Coluna marca adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'moedafob')
    BEGIN
        ALTER TABLE produtos ADD moedafob varchar(10) NULL;
        PRINT 'Coluna moedafob adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'preco_venda')
    BEGIN
        ALTER TABLE produtos ADD preco_venda decimal(18,2) NULL;
        PRINT 'Coluna preco_venda adicionada à tabela produtos.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'produtos' AND COLUMN_NAME = 'updated_at')
    BEGIN
        ALTER TABLE produtos ADD updated_at datetime NULL;
        PRINT 'Coluna updated_at adicionada à tabela produtos.';
    END;
END;

-- Tabela de grupos (Verificar se existe antes de criar)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'grupos')
BEGIN
    CREATE TABLE grupos (
        ano int NOT NULL,
        id_tipo int NOT NULL,
        tipo varchar(50) NOT NULL,
        code varchar(50) NOT NULL,
        PRIMARY KEY (ano, id_tipo)
    );
    PRINT 'Tabela grupos criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'A tabela grupos já existe.';
END;

-- Tabela de configurações mensais (Verificar se existe antes de criar)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'month_configurations')
BEGIN
    CREATE TABLE month_configurations (
        ano int NOT NULL,
        mes varchar(3) NOT NULL,
        pct_atual decimal(5,2) NOT NULL,
        realizado bit NOT NULL,
        PRIMARY KEY (ano, mes)
    );
    PRINT 'Tabela month_configurations criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'A tabela month_configurations já existe.';
END;

-- Tabela de valores do forecast (Verificar se existe antes de criar)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'forecast_values')
BEGIN
    CREATE TABLE forecast_values (
        produto_codigo varchar(50) NOT NULL,
        ano int NOT NULL,
        id_tipo int NOT NULL,
        mes varchar(3) NOT NULL,
        valor decimal(18,2) NOT NULL,
        user_id int NULL,
        username varchar(100) NULL,
        user_fullname varchar(100) NULL,
        modified_at datetime NULL,
        PRIMARY KEY (produto_codigo, ano, id_tipo, mes)
    );
    PRINT 'Tabela forecast_values criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'A tabela forecast_values já existe.';
END;

-- Adicionar colunas à tabela forecast_values se não existirem
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'forecast_values')
BEGIN
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'forecast_values' AND COLUMN_NAME = 'user_fullname')
    BEGIN
        ALTER TABLE forecast_values ADD user_fullname varchar(100) NULL;
        PRINT 'Coluna user_fullname adicionada à tabela forecast_values.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'forecast_values' AND COLUMN_NAME = 'username')
    BEGIN
        ALTER TABLE forecast_values ADD username varchar(100) NULL;
        PRINT 'Coluna username adicionada à tabela forecast_values.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'forecast_values' AND COLUMN_NAME = 'metodo')
    BEGIN
        ALTER TABLE forecast_values ADD metodo varchar(10) NOT NULL DEFAULT 'USER';
        PRINT 'Coluna metodo adicionada à tabela forecast_values.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'forecast_values' AND COLUMN_NAME = 'user_id')
    BEGIN
        ALTER TABLE forecast_values ADD user_id int NULL;
        PRINT 'Coluna user_id adicionada à tabela forecast_values.';
    END;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'forecast_values' AND COLUMN_NAME = 'modified_at')
    BEGIN
        ALTER TABLE forecast_values ADD modified_at datetime NULL;
        PRINT 'Coluna modified_at adicionada à tabela forecast_values.';
    END;
END;

-- Tabela de usuários (Esta tabela é necessária e não existe ainda)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'usuarios')
BEGIN
    CREATE TABLE usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        nome NVARCHAR(100),
        role NVARCHAR(50) DEFAULT 'user',
        created_at DATETIME DEFAULT GETDATE(),
        last_login DATETIME
    );
    
    PRINT 'Tabela usuarios criada com sucesso.';

    -- Criar usuário admin automaticamente após criar a tabela
    INSERT INTO usuarios (username, password_hash, nome, role)
    VALUES ('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Administrador', 'admin');
    PRINT 'Usuário admin criado com sucesso.';
END
ELSE
BEGIN
    PRINT 'A tabela usuarios já existe.';
    
    -- Verificar se o usuário admin existe e criar se não existir
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'admin')
    BEGIN
        INSERT INTO usuarios (username, password_hash, nome, role)
        VALUES ('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Administrador', 'admin');
        PRINT 'Usuário admin criado com sucesso.';
    END
    ELSE
    BEGIN
        PRINT 'O usuário admin já existe.';
    END;
END;

-- Tabela de logs de alterações nos valores do forecast (Esta tabela também é necessária)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'forecast_values_log')
BEGIN
    CREATE TABLE forecast_values_log (
        id INT IDENTITY(1,1) PRIMARY KEY,
        produto_codigo VARCHAR(50) NOT NULL,
        ano INT NOT NULL,
        id_tipo INT NOT NULL,
        mes VARCHAR(3) NOT NULL,
        valor_anterior DECIMAL(18,2),
        valor_novo DECIMAL(18,2) NOT NULL,
        user_id INT,
        username VARCHAR(100),
        user_fullname varchar(100),
        modified_at DATETIME DEFAULT GETDATE()
    );
    
    PRINT 'Tabela forecast_values_log criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'A tabela forecast_values_log já existe.';
    
    -- Adicionar coluna user_fullname à tabela de logs se não existir
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'forecast_values_log' AND COLUMN_NAME = 'user_fullname')
    BEGIN
        ALTER TABLE forecast_values_log ADD user_fullname varchar(100) NULL;
        PRINT 'Coluna user_fullname adicionada à tabela forecast_values_log.';
    END;
END;
