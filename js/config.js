// ============================================
// AURORA FITNESS - CONFIGURAÇÕES
// ============================================
// ⚠️ ATENÇÃO: Este arquivo NÃO deve ser commitado!
// Crie este arquivo localmente com suas credenciais

const CONFIG = {
    // URL do seu projeto Supabase
    SUPABASE_URL: 'https://hupkzyvbvfpzeihhmgxg.supabase.co',
    
    // Chave anon/public do Supabase (Settings > API)
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1cGt6eXZidmZwemVpaGhtZ3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjU2NzksImV4cCI6MjA5MjQwMTY3OX0.YevRjHVLFOUFIGcoj0k0dGcFcpUquhW9LTFdsbuRWmE',
    
    // Configurações de sessão
    SESSION_KEY: 'aurora_fitness_session',
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 horas
    
    // Credenciais padrão (desenvolvimento)
    DEFAULT_INSTRUCTOR: {
        id: 'admin',
        password: '123456'
    },
    DEFAULT_CLIENT: {
        id: 'CLI001',
        password: 'cliente123'
    }
};
