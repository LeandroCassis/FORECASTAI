
import sql from 'mssql';

const config: sql.config = {
    server: 'vesperttine-server.database.windows.net',
    database: 'VESPERTTINE',
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

let pool: sql.ConnectionPool | null = null;

export async function getConnection() {
    if (!pool) {
        try {
            pool = await new sql.ConnectionPool(config).connect();
            console.log('Successfully connected to database');
        } catch (err) {
            console.error('Database connection error:', err);
            throw err;
        }
    }
    return pool;
}

export async function query<T>(queryString: string, params?: any[]): Promise<T[]> {
    const connection = await getConnection();
    try {
        const request = connection.request();
        if (params) {
            params.forEach((param, index) => {
                request.input(`p${index}`, param);
            });
        }
        const result = await request.query(queryString);
        return result.recordset;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
