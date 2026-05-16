// ============================================
// AURORA FITNESS - CONFIGURAÇÕES
// ============================================
// IMPORTANTE: Não commitar este arquivo no GitHub!
// Use o config.example.js como referência.

const CONFIG = {
    // Substitua com SUAS credenciais do Supabase
    SUPABASE_URL: 'https://SEU_PROJETO.supabase.co',
    SUPABASE_KEY: 'SUA_CHAVE_ANON_PUBLIC',
    
    // Configurações de sessão
    SESSION_KEY: 'aurora_fitness_session',
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 horas
    
    // Credenciais padrão (apenas para desenvolvimento)
    DEFAULT_INSTRUCTOR: {
        id: 'admin',
        password: '123456'
    },
    DEFAULT_CLIENT: {
        id: 'CLI001',
        password: 'cliente123'
    }
};
