// ============================================
// AURORA FITNESS - AUTENTICAÇÃO
// ============================================

class Auth {
    static isAuthenticated() {
        const session = localStorage.getItem(CONFIG.SESSION_KEY);
        if (!session) return false;
        
        try {
            const sessionData = JSON.parse(session);
            
            // Verificar expiração
            if (Date.now() > sessionData.expiresAt) {
                this.logout();
                return false;
            }
            
            return true;
        } catch {
            this.logout();
            return false;
        }
    }

    static getSession() {
        const session = localStorage.getItem(CONFIG.SESSION_KEY);
        if (!session) return null;
        
        try {
            return JSON.parse(session);
        } catch {
            return null;
        }
    }

    static async login(userType, userId, password) {
        try {
            if (userType === 'instructor') {
                return await this.loginInstructor(userId, password);
            } else if (userType === 'client') {
                return await this.loginClient(userId, password);
            }
            
            return { success: false, message: 'Tipo de usuário inválido' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Erro ao realizar login' };
        }
    }

    static async loginInstructor(instructorId, password) {
        // Para desenvolvimento: verificar credenciais padrão
        if (instructorId === CONFIG.DEFAULT_INSTRUCTOR.id && 
            password === CONFIG.DEFAULT_INSTRUCTOR.password) {
            
            const sessionData = {
                userId: 'default-instructor',
                userType: 'instructor',
                name: 'Instrutor',
                loginTime: new Date().toISOString(),
                expiresAt: Date.now() + CONFIG.SESSION_DURATION
            };
            
            this.createSession(sessionData);
            
            return { 
                success: true, 
                message: 'Login realizado com sucesso',
                user: sessionData
            };
        }
        
        // Em produção: buscar do Supabase
        try {
            const profile = await DB.getInstructorById(instructorId);
            
            if (profile && profile.password_hash === password) {
                const sessionData = {
                    userId: profile.id,
                    userType: 'instructor',
                    name: profile.name,
                    loginTime: new Date().toISOString(),
                    expiresAt: Date.now() + CONFIG.SESSION_DURATION
                };
                
                this.createSession(sessionData);
                
                return { 
                    success: true, 
                    message: 'Login realizado com sucesso',
                    user: sessionData
                };
            }
        } catch (error) {
            console.error('Erro ao buscar instrutor:', error);
        }
        
        return { success: false, message: 'ID ou senha incorretos' };
    }

    static async loginClient(clientCode, password) {
        try {
            const client = await DB.getClientByCode(clientCode);
            
            if (client && client.profile && client.profile.password_hash === password) {
                const sessionData = {
                    userId: client.profile.id,
                    clientId: client.id,
                    userType: 'client',
                    name: client.profile.name,
                    clientCode: client.client_code,
                    loginTime: new Date().toISOString(),
                    expiresAt: Date.now() + CONFIG.SESSION_DURATION
                };
                
                this.createSession(sessionData);
                
                return { 
                    success: true, 
                    message: 'Login realizado com sucesso',
                    user: sessionData
                };
            }
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
        }
        
        // Fallback para desenvolvimento
        if (clientCode === CONFIG.DEFAULT_CLIENT.id && 
            password === CONFIG.DEFAULT_CLIENT.password) {
            
            const sessionData = {
                userId: 'default-client',
                clientId: 'default-client-id',
                userType: 'client',
                name: 'Aluno Teste',
                clientCode: 'CLI001',
                loginTime: new Date().toISOString(),
                expiresAt: Date.now() + CONFIG.SESSION_DURATION
            };
            
            this.createSession(sessionData);
