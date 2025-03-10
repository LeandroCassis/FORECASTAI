import express from 'express';
import cors from 'cors';
import { query } from '../src/integrations/azure/client.js';

const app = express();
const port = 3005;

app.use(cors());
app.use(express.json());

// Get product by name
app.get('/api/produtos/:produto', async (req, res) => {
    try {
        const data = await query<{
            codigo: string;
            produto: string;
            created_at: Date | null;
            data_atualizacao_fob: Date | null;
            empresa: string;
            estoque: number | null;
            fabrica: string;
            familia1: string;
            familia2: string;
            fob: number | null;
            indice: number | null;
            marca: string;
            moedafob: string | null;
            preco_venda: number | null;
            updated_at: Date | null;
        }>(
            'SELECT * FROM produtos WHERE produto = @p0',
            [req.params.produto]
        );
        res.json(data[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all produtos for filtering
app.get('/api/produtos', async (req, res) => {
    try {
        const data = await query<{
            codigo: string;
            produto: string;
            empresa: string;
            fabrica: string;
            familia1: string;
            familia2: string;
            marca: string;
        }>(
            'SELECT codigo, produto, empresa, fabrica, familia1, familia2, marca FROM produtos'
        );
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all grupos
app.get('/api/grupos', async (req, res) => {
    try {
        const data = await query<{
            ano: number;
            id_tipo: number;
            tipo: string;
            code: string;
        }>(
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
        const data = await query<{
            ano: number;
            mes: string;
            pct_atual: number;
            realizado: boolean;
        }>(
            'SELECT * FROM month_configurations ORDER BY ano, mes'
        );
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get forecast values by product code
app.get('/api/forecast-values/:productCode', async (req, res) => {
    try {
        const data = await query<{
            ano: number;
            id_tipo: number;
            mes: string;
            valor: number;
        }>(
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
        const { productCodigo, ano, id_tipo, mes, valor } = req.body;
        await query(
            `MERGE INTO forecast_values AS target
             USING (VALUES (@p0, @p1, @p2, @p3, @p4)) 
             AS source (produto_codigo, ano, id_tipo, mes, valor)
             ON target.produto_codigo = source.produto_codigo 
             AND target.ano = source.ano 
             AND target.id_tipo = source.id_tipo 
             AND target.mes = source.mes
             WHEN MATCHED THEN
               UPDATE SET valor = source.valor
             WHEN NOT MATCHED THEN
               INSERT (produto_codigo, ano, id_tipo, mes, valor)
               VALUES (source.produto_codigo, source.ano, source.id_tipo, source.mes, source.valor);`,
            [productCodigo, ano, id_tipo, mes, valor]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
