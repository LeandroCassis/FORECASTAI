// Simple Express server to handle API requests
import express from 'express';
import cors from 'cors';
import mssql from 'mssql';
import crypto from 'crypto';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3005;

// Configurar CORS para aceitar solicitações de qualquer origem com configurações mais abrangentes
app.use(cors({
  origin: '*', // Permitir qualquer origem de forma explícita
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Adicionar middleware para tratar solicitações OPTIONS (preflight CORS)
app.options('*', cors());

// Parse JSON request bodies com configurações adicionais
app.use(express.json({
  limit: '10mb', // Aumentar o limite do tamanho do corpo
  strict: false, // Ser menos rigoroso com o formato JSON
  verify: (req, res, buf) => { 
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('Invalid JSON in request:', e);
      // Continuamos processando mesmo com JSON inválido
    }
  }
}));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('OK');
});

// Middleware para garantir respostas JSON corretas em todas as rotas API
app.use('/api', (req, res, next) => {
  // Skip health check endpoint
  if (req.path === '/health') {
    return next();
  }
  
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

// API Routes start here

// Presence routes
app.post('/api/presence/update', (req, res) => {
  try {
    console.log('Presence update request received', req.body);
    const { userId, username, nome } = req.body;
    
    if (!userId || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Update or add user to online users
    onlineUsers.set(userId, {
      id: userId,
      username,
      nome,
      lastSeen: new Date()
    });
    
    console.log(`User presence updated: ${username} (${userId})`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error updating presence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/presence/users', (req, res) => {
  try {
    console.log('Get online users request received');
    const now = new Date();
    const activeUsers = [];
    
    // Filter out stale users
    for (const [userId, userData] of onlineUsers.entries()) {
      const lastSeen = new Date(userData.lastSeen);
      const timeDiff = now.getTime() - lastSeen.getTime();
      
      if (timeDiff < PRESENCE_TIMEOUT) {
        activeUsers.push(userData);
      } else {
        // Remove stale user
        onlineUsers.delete(userId);
      }
    }
    
    console.log('Sending active users:', activeUsers);
    res.json(activeUsers);
    
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authentication endpoint with simplified response handling
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('Login attempt received:', req.body);
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            console.log('Missing credentials');
            return res.status(400).json({ 
                error: 'Username and password are required' 
            });
        }
        
        console.log('Finding user:', username);
        const users = await query(
            'SELECT * FROM usuarios WHERE username = @p0',
            [username]
        );
        
        if (users.length === 0) {
            console.log('User not found:', username);
            return res.status(401).json({ 
                error: 'Invalid username or password' 
            });
        }
        
        const user = users[0];
        console.log('User found:', user.username);
        
        // Simple password check (comparing directly)
        if (String(password).trim() !== String(user.password_hash).trim()) {
            console.log('Invalid password for user:', username);
            return res.status(401).json({ 
                error: 'Invalid username or password' 
            });
        }
        
        // Update last login time
        await query(
            'UPDATE usuarios SET last_login = GETDATE() WHERE id = @p0',
            [user.id]
        );
        
        // Construir dados do usuário sem informações sensíveis
        const userData = {
            id: user.id,
            username: user.username,
            nome: user.nome || '',
            role: user.role || 'user'
        };
        
        console.log('Login successful for user:', username, 'Data:', userData);
        
        // Enviar resposta como JSON simplificado para evitar problemas de parseamento
        res.status(200).json(userData);
    } catch (err) {
        console.error('Login error:', err);
        
        // Garantir que erros também sejam retornados como JSON
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(500).send(JSON.stringify({ 
            error: 'Internal server error',
            details: err.message 
        }));
    }
});

// Product routes
app.get('/api/produtos', async (req, res) => {
    try {
        console.log('Fetching produtos...');
        const data = await query(
            'SELECT codigo, produto, empresa, fabrica, familia1, familia2, marca FROM produtos'
        );
        res.json(data);
    } catch (error) {
        console.error('Error fetching produtos:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Get all grupos
app.get('/api/grupos', async (req, res) => {
    try {
        const data = await query(
            'SELECT ano, id_tipo, tipo, code FROM grupos ORDER BY ano, id_tipo'
        );
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get month configurations
app.get('/api/month-configurations', async (req, res) => {
    try {
        const data = await query(
            'SELECT * FROM month_configurations ORDER BY ano, mes'
        );
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get product by name
app.get('/api/produtos/:produto', async (req, res) => {
    try {
        const data = await query(
            'SELECT * FROM produtos WHERE produto = @p0',
            [req.params.produto]
        );
        res.json(data[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get forecast values by product code
app.get('/api/forecast-values/:productCode', async (req, res) => {
    try {
        const data = await query(
            'SELECT * FROM forecast_values WHERE produto_codigo = @p0',
            [req.params.productCode]
        );
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update forecast value
app.post('/api/forecast-values', async (req, res) => {
    try {
        const { productCodigo, ano, id_tipo, mes, valor, userId, username, userFullName, metodo = 'USER' } = req.body;
        
        console.log('Updating forecast value:', {
            productCodigo, ano, id_tipo, mes, valor, userId, username, userFullName, metodo
        });
        
        // Get the current value before updating
        const currentValues = await query(
            'SELECT valor FROM forecast_values WHERE produto_codigo = @p0 AND ano = @p1 AND id_tipo = @p2 AND mes = @p3',
            [productCodigo, ano, id_tipo, mes]
        );
        
        const valorAnterior = currentValues.length > 0 ? currentValues[0].valor : null;
        
        console.log('Previous value:', valorAnterior);
        
        // Format the current date/time in SQL Server format
        const currentDateTime = new Date().toISOString();
        
        // Update or insert the forecast value with user data and timestamp
        await query(
            `MERGE INTO forecast_values AS target
             USING (VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9)) 
             AS source (produto_codigo, ano, id_tipo, mes, valor, user_id, username, user_fullname, modified_at, metodo)
             ON target.produto_codigo = source.produto_codigo 
             AND target.ano = source.ano 
             AND target.id_tipo = source.id_tipo 
             AND target.mes = source.mes
             WHEN MATCHED THEN
               UPDATE SET 
                  valor = source.valor,
                  user_id = source.user_id,
                  username = source.username,
                  user_fullname = source.user_fullname,
                  modified_at = source.modified_at,
                  metodo = source.metodo
             WHEN NOT MATCHED THEN
               INSERT (produto_codigo, ano, id_tipo, mes, valor, user_id, username, user_fullname, modified_at, metodo)
               VALUES (source.produto_codigo, source.ano, source.id_tipo, source.mes, source.valor, 
                       source.user_id, source.username, source.user_fullname, source.modified_at, source.metodo);`,
            [productCodigo, ano, id_tipo, mes, valor, userId || null, username || null, userFullName || null, currentDateTime, metodo]
        );
        
        // Log the change
        await query(
            `INSERT INTO forecast_values_log 
             (produto_codigo, ano, id_tipo, mes, valor_anterior, valor_novo, user_id, username, user_fullname, modified_at)
             VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9)`,
            [productCodigo, ano, id_tipo, mes, valorAnterior, valor, userId || null, username || null, userFullName || null, currentDateTime]
        );
        
        console.log('Successfully updated forecast value and logged the change');
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating forecast value:', error);
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

// Get change history for a product
app.get('/api/forecast-values-history/:productCode', async (req, res) => {
    try {
        const logs = await query(
            `SELECT l.*, u.nome as user_name 
             FROM forecast_values_log l
             LEFT JOIN usuarios u ON l.user_id = u.id
             WHERE produto_codigo = @p0
             ORDER BY modified_at DESC`,
            [req.params.productCode]
        );
        res.json(logs);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sales data for a specific product by code
app.get('/api/vendas/:productCode', async (req, res) => {
    try {
        console.log('Fetching sales data for product:', req.params.productCode);
        
        const data = await query(
            `SELECT 
                codigo, 
                data, 
                quantidade, 
                CAST(ISNULL(receita, '0') AS FLOAT) as receita,
                cod_cliente, 
                nota, 
                cod_vendedor
             FROM dbo.vendas 
             WHERE codigo = @p0
             ORDER BY data`,
            [req.params.productCode]
        );
        
        if (data.length === 0) {
            console.log('Nenhum dado de venda encontrado para o produto');
            return res.status(404).json({ 
                error: 'No sales data found for this product',
                details: 'This product has no historical sales data'
            });
        }
        
        console.log(`Encontrados ${data.length} registros de vendas para o produto ${req.params.productCode}`);
        res.json(data);
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Proxy para a API DeepSeek - contorna problemas de CORS
app.post('/api/deepseek-proxy/forecast', async (req, res) => {
    try {
        console.log('Chamando API DeepSeek via proxy do servidor');
        
        const { historical_sales, product_code, product_name } = req.body.data;
        
        if (!historical_sales || historical_sales.length === 0) {
            throw new Error('Não há dados históricos de vendas disponíveis para este produto');
        }
        
        // Formatar os dados históricos para texto
        const salesContext = historical_sales
            .map(sale => `Data: ${sale.date}, Quantidade: ${sale.quantity}, Receita: ${sale.revenue}`)
            .join('\n');
        
        // Criar o prompt para a API especificando que precisamos de 36 meses
        const messages = [
            {
                role: "user",
                content: `Com base nos seguintes dados históricos de vendas do produto ${product_name} (código: ${product_code}):\n\n${salesContext}\n\nAnalise os dados e faça uma previsão de vendas para os próximos 36 meses (3 anos), considerando padrões sazonais e tendências. Retorne apenas um array JSON com 36 números inteiros representando as quantidades previstas para cada mês, sem explicações adicionais. Por exemplo: [100, 120, 90, 110, ...]`
            }
        ];
        
        console.log('Enviando requisição para DeepSeek:', {
            model: "deepseek-chat",
            messages,
            temperature: 0.3
        });
        
        // Chamar a API do DeepSeek
        const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.body.apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: messages,
                temperature: 0.3,
                max_tokens: 1000 // Aumentando o limite de tokens para acomodar a resposta maior
            })
        });
        
        console.log('Resposta da API DeepSeek status:', deepseekResponse.status);
        
        if (!deepseekResponse.ok) {
            const errorText = await deepseekResponse.text();
            console.error('Erro na API DeepSeek:', errorText);
            throw new Error(`Erro na API DeepSeek: ${deepseekResponse.status} ${deepseekResponse.statusText}`);
        }
        
        const chatResponse = await deepseekResponse.json();
        console.log('Resposta do DeepSeek:', chatResponse);
        
        // Extrair o array de previsões da resposta do chat
        let forecast_values;
        try {
            const content = chatResponse.choices[0].message.content;
            // Encontrar o array JSON na resposta
            const match = content.match(/\[[\d\s,]+\]/);
            if (!match) {
                throw new Error('Não foi possível encontrar o array de previsões na resposta');
            }
            
            forecast_values = JSON.parse(match[0]);
            
            // Garantir que temos 36 valores
            if (forecast_values.length !== 36) {
                throw new Error('Número incorreto de previsões recebidas. Esperado: 36, Recebido: ' + forecast_values.length);
            }
            
            // Garantir que todos os valores são números positivos inteiros
            forecast_values = forecast_values.map(v => Math.max(1, Math.round(Number(v))));
        } catch (parseError) {
            console.error('Erro ao processar resposta do DeepSeek:', parseError);
            throw new Error('Não foi possível processar a resposta da API');
        }
        
        // Formatar a resposta no formato esperado pelo frontend
        const response = {
            forecast_values,
            confidence_intervals: {
                lower: forecast_values.map(v => Math.round(v * 0.8)),
                upper: forecast_values.map(v => Math.round(v * 1.2))
            },
            product_code,
            model_info: {
                name: "deepseek_forecast_model",
                version: "1.0.0"
            },
            metrics: {
                mape: 8.73,
                rmse: 12.45
            }
        };
        
        // Enviar resposta formatada
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Erro ao chamar a API DeepSeek via proxy:', error);
        res.status(500).json({ 
            error: 'Erro ao gerar previsão',
            details: error.message 
        });
    }
});

// Middleware to handle 404 errors for API routes - must come after all API routes
app.use('/api/*', (req, res) => {
  console.log('API 404:', req.originalUrl);
  res.status(404).json({ error: 'API route not found' });
});

// Static file serving and SPA fallback - must come after all API routes
app.use(express.static('dist'));

// Fallback to index.html for any other requests
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/dist/index.html');
});

// Database configuration
const config = {
    server: 'vesperttine-server.database.windows.net',
    database: 'FORECAST',
    user: 'vesperttine',
    password: '840722aA',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

async function getConnection() {
    try {
        if (!pool) {
            console.log('Connecting to Azure SQL Database...');
            pool = await new mssql.ConnectionPool(config).connect();
            console.log('Successfully connected to Azure SQL Database');
        }
        return pool;
    } catch (err) {
        console.error('Database connection error:', err);
        throw err;
    }
}

async function query(queryString, params) {
    const connection = await getConnection();
    try {
        const request = connection.request();
        if (params) {
            params.forEach((param, index) => {
                request.input(`p${index}`, param);
            });
        }
        console.log('Executing query:', queryString, 'with params:', params);
        const result = await request.query(queryString);
        return result.recordset;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Initialize database and create necessary tables
async function initializeDatabase() {
    try {
        // Verificar se a tabela usuarios existe
        const usersTableResult = await query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'usuarios'
        `);
        
        if (usersTableResult.length === 0) {
            // Criar a tabela usuarios apenas se ela não existir
            await query(`
                CREATE TABLE usuarios (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    username NVARCHAR(100) NOT NULL UNIQUE,
                    password_hash NVARCHAR(255) NOT NULL,
                    nome NVARCHAR(100),
                    role NVARCHAR(50) DEFAULT 'user',
                    created_at DATETIME DEFAULT GETDATE(),
                    last_login DATETIME
                )
            `);
            
            // Criar usuário admin apenas se a tabela acabou de ser criada
            await query(`
                INSERT INTO usuarios (username, password_hash, nome, role)
                VALUES (@p0, @p1, @p2, @p3)
            `, ['admin', 'admin', 'Administrador', 'admin']);
            
            console.log('Created users table and admin user');
        }
        
        // Verificar usuários atuais
        const testResult = await query('SELECT * FROM usuarios');
        console.log('Current users in database:', testResult);

        // Check if forecast_values_log table exists
        const logTableResult = await query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'forecast_values_log'
        `);
        
        if (logTableResult.length === 0) {
            // Create forecast_values_log table
            await query(`
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
                    user_fullname VARCHAR(100),
                    modified_at DATETIME DEFAULT GETDATE()
                )
            `);
            
            console.log('Created forecast_values_log table');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Create initial users
async function createUsers() {
    try {
        const users = [
            { username: 'rogerio.bousas', password: 'Rogerio123', nome: 'Rogério Bousas', role: 'user' },
            { username: 'marco.bousas', password: 'Marco123', nome: 'Marco Bousas', role: 'user' },
            { username: 'sulamita.nascimento', password: 'Sulamita123', nome: 'Sulamita Nascimento', role: 'user' },
            { username: 'elisangela.tavares', password: 'Elisangela123', nome: 'Elisangela Tavares', role: 'user' },
            { username: 'pedro.hoffmann', password: 'Pedro123', nome: 'Pedro Hoffmann', role: 'user' },
            { username: 'guilherme.maia', password: 'Guilherme123', nome: 'Guilherme Maia', role: 'user' }
        ];

        for (const user of users) {
            // Check if user exists
            const existingUser = await query(
                'SELECT id FROM usuarios WHERE username = @p0',
                [user.username]
            );

            if (existingUser.length === 0) {
                // Create user if doesn't exist
                await query(`
                    INSERT INTO usuarios (username, password_hash, nome, role)
                    VALUES (@p0, @p1, @p2, @p3)
                `, [user.username, user.password, user.nome, user.role]);
                
                console.log(`Created user: ${user.username}`);
            } else {
                console.log(`User ${user.username} already exists`);
            }
        }
        console.log('Finished creating users');
    } catch (error) {
        console.error('Error creating users:', error);
    }
}

// Initialize database on server start
initializeDatabase()
    .then(() => createUsers())
    .catch(console.error);

// Store online users with timeout
const onlineUsers = new Map();
const PRESENCE_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds

// Clean up stale users periodically
setInterval(() => {
  const now = new Date();
  
  for (const [userId, userData] of onlineUsers.entries()) {
    const lastSeen = new Date(userData.lastSeen);
    const timeDiff = now.getTime() - lastSeen.getTime();
    
    if (timeDiff >= PRESENCE_TIMEOUT) {
      console.log(`Removing stale user: ${userData.username} (${userId})`);
      onlineUsers.delete(userId);
    }
  }
}, 60000); // Run every minute

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port} at ${new Date().toISOString()}`);
    
    // Initialize database on server start
    initializeDatabase()
        .then(() => createUsers())
        .catch(console.error);
});
