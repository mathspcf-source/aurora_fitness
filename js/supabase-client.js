// ============================================
// AURORA FITNESS - CLIENTE SUPABASE
// ============================================

class SupabaseClient {
    constructor() {
        this.client = null;
        this.init();
    }

    init() {
        // Verificar se o SDK do Supabase foi carregado
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase SDK não carregado. Verifique se o CDN está antes deste script.');
            console.error('Ordem correta: supabase CDN → config.js → supabase-client.js');
            return;
        }
        
        // Verificar se as configurações existem
        if (typeof CONFIG === 'undefined') {
            console.error('❌ CONFIG não encontrado. Verifique se config.js foi carregado.');
            return;
        }
        
        if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
            console.error('❌ Configurações do Supabase incompletas. Verifique config.js');
            console.error('SUPABASE_URL:', CONFIG.SUPABASE_URL);
            console.error('SUPABASE_KEY:', CONFIG.SUPABASE_KEY ? 'Carregada ✓' : 'Faltando ✗');
            return;
        }
        
        try {
            this.client = window.supabase.createClient(
                CONFIG.SUPABASE_URL,
                CONFIG.SUPABASE_KEY
            );
            console.log('✅ Supabase conectado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao conectar ao Supabase:', error);
        }
    }

    // Verificar se o cliente está pronto
    isReady() {
        if (!this.client) {
            console.error('❌ Supabase não inicializado. Execute init() primeiro.');
            return false;
        }
        return true;
    }

    // ---------- PROFILES ----------
    async getProfile(userId, userType) {
        if (!this.isReady()) return null;
        
        const { data, error } = await this.client
            .from('profiles')
            .select('*')
            .eq('user_type', userType)
            .eq('is_active', true)
            .single();
        
        if (error) {
            console.error('Erro ao buscar perfil:', error);
            throw error;
        }
        return data;
    }

    async getInstructorById(instructorId) {
        if (!this.isReady()) return null;
        
        const { data, error } = await this.client
            .from('profiles')
            .select('*')
            .eq('user_type', 'instructor')
            .eq('is_active', true)
            .single();
        
        if (error) {
            console.error('Erro ao buscar instrutor:', error);
            return null;
        }
        return data;
    }

    // ---------- CLIENTS ----------
    async getClients(instructorId = null) {
        if (!this.isReady()) return [];
        
        try {
            // Buscar todos os perfis de clientes ativos
            const { data: profiles, error: profilesError } = await this.client
                .from('profiles')
                .select('*')
                .eq('user_type', 'client')
                .eq('is_active', true);
            
            if (profilesError) throw profilesError;
            
            // Buscar dados dos clientes
            const { data: clientsData, error: clientsError } = await this.client
                .from('clients')
                .select('*')
                .eq('is_active', true);
            
            if (clientsError) throw clientsError;
            
            // Combinar dados
            const clients = clientsData.map(client => {
                const profile = profiles.find(p => p.id === client.profile_id);
                return {
                    ...client,
                    profile: profile || null
                };
            });
            
            // Filtrar por instrutor se necessário
            if (instructorId) {
                return clients.filter(c => c.instructor_id === instructorId);
            }
            
            return clients;
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            return [];
        }
    }

    async getClientByCode(clientCode) {
        if (!this.isReady()) return null;
        
        try {
            const { data: client, error: clientError } = await this.client
                .from('clients')
                .select('*')
                .eq('client_code', clientCode)
                .eq('is_active', true)
                .single();
            
            if (clientError || !client) return null;
            
            const { data: profile, error: profileError } = await this.client
                .from('profiles')
                .select('*')
                .eq('id', client.profile_id)
                .single();
            
            if (profileError) return null;
            
            return {
                ...client,
                profile: profile
            };
        } catch (error) {
            console.error('Erro ao buscar cliente por código:', error);
            return null;
        }
    }

    async createClient(clientData) {
        if (!this.isReady()) throw new Error('Supabase não inicializado');
        
        // Criar perfil primeiro
        const { data: profile, error: profileError } = await this.client
            .from('profiles')
            .insert({
                user_type: 'client',
                name: clientData.name,
                phone: clientData.phone || null,
                password_hash: clientData.password
            })
            .select()
            .single();
        
        if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
            throw profileError;
        }
        
        // Criar registro na tabela clients
        const { data: clientRecord, error: clientError } = await this.client
            .from('clients')
            .insert({
                profile_id: profile.id,
                client_code: clientData.clientCode,
                instructor_id: clientData.instructorId || null,
                gender: clientData.gender || null,
                birth_date: clientData.birthDate || null
            })
            .select()
            .single();
        
        if (clientError) {
            console.error('Erro ao criar cliente:', clientError);
            // Rollback: deletar perfil criado
            await this.client.from('profiles').delete().eq('id', profile.id);
            throw clientError;
        }
        
        return {
            ...clientRecord,
            profile: profile
        };
    }

    async updateClient(clientId, clientData) {
        if (!this.isReady()) throw new Error('Supabase não inicializado');
        
        // Atualizar perfil
        const { error: profileError } = await this.client
            .from('profiles')
            .update({
                name: clientData.name,
                phone: clientData.phone || null,
                password_hash: clientData.password
            })
            .eq('id', clientData.profileId);
        
        if (profileError) throw profileError;
        
        // Atualizar dados do cliente
        const { data, error } = await this.client
            .from('clients')
            .update({
                gender: clientData.gender || null,
                birth_date: clientData.birthDate || null
            })
            .eq('id', clientId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async deleteClient(clientId, profileId) {
        if (!this.isReady()) throw new Error('Supabase não inicializado');
        
        // Soft delete no cliente
        const { error: clientError } = await this.client
            .from('clients')
            .update({ is_active: false })
            .eq('id', clientId);
        
        if (clientError) throw clientError;
        
        // Soft delete no perfil
        const { error: profileError } = await this.client
            .from('profiles')
            .update({ is_active: false })
            .eq('id', profileId);
        
        if (profileError) throw profileError;
        
        return true;
    }

    // ---------- WORKOUT SHEETS ----------
    async getWorkoutSheets(clientId = null) {
        if (!this.isReady()) return [];
        
        try {
            let query = this.client
                .from('workout_sheets')
                .select('*')
                .eq('is_active', true);
            
            if (clientId) {
                query = query.eq('client_id', clientId);
            }
            
            const { data: sheets, error: sheetsError } = await query.order('created_at', { ascending: false });
            
            if (sheetsError) throw sheetsError;
            if (!sheets || sheets.length === 0) return [];
            
            // Buscar exercícios para cada ficha
            const sheetsWithExercises = await Promise.all(
                sheets.map(async (sheet) => {
                    const { data: exercises, error: exercisesError } = await this.client
                        .from('exercises')
                        .select('*')
                        .eq('sheet_id', sheet.id)
                        .order('order_index', { ascending: true });
                    
                    if (exercisesError) {
                        console.error('Erro ao buscar exercícios:', exercisesError);
                        return { ...sheet, exercises: [] };
                    }
                    
                    return {
                        ...sheet,
                        exercises: exercises || []
                    };
                })
            );
            
            return sheetsWithExercises;
        } catch (error) {
            console.error('Erro ao buscar fichas:', error);
            return [];
        }
    }

    async createWorkoutSheet(sheetData) {
        if (!this.isReady()) throw new Error('Supabase não inicializado');
        
        // Criar ficha
        const { data: sheet, error: sheetError } = await this.client
            .from('workout_sheets')
            .insert({
                client_id: sheetData.clientId,
                instructor_id: sheetData.instructorId || null,
                name: sheetData.name,
                type: sheetData.type || 'custom',
                notes: sheetData.notes || null
            })
            .select()
            .single();
        
        if (sheetError) throw sheetError;
        
        // Inserir exercícios
        if (sheetData.exercises && sheetData.exercises.length > 0) {
            const exercises = sheetData.exercises.map((ex, index) => ({
                sheet_id: sheet.id,
                name: ex.name,
                muscle_group: ex.muscleGroup || ex.group || null,
                series: ex.series || '3',
                reps: ex.reps || '12',
                load: ex.load || null,
                rest_time: ex.restTime || '60',
                notes: ex.notes || null,
                order_index: index
            }));
            
            const { error: exercisesError } = await this.client
                .from('exercises')
                .insert(exercises);
            
            if (exercisesError) {
                // Rollback
                await this.client.from('workout_sheets').delete().eq('id', sheet.id);
                throw exercisesError;
            }
        }
        
        return sheet;
    }

    async updateWorkoutSheet(sheetId, sheetData) {
        if (!this.isReady()) throw new Error('Supabase não inicializado');
        
        // Atualizar ficha
        const { error: sheetError } = await this.client
            .from('workout_sheets')
            .update({
                name: sheetData.name,
                type: sheetData.type || 'custom',
                notes: sheetData.notes || null
            })
            .eq('id', sheetId);
        
        if (sheetError) throw sheetError;
        
        // Deletar exercícios antigos
        const { error: deleteError } = await this.client
            .from('exercises')
            .delete()
            .eq('sheet_id', sheetId);
        
        if (deleteError) throw deleteError;
        
        // Inserir novos exercícios
        if (sheetData.exercises && sheetData.exercises.length > 0) {
            const exercises = sheetData.exercises.map((ex, index) => ({
                sheet_id: sheetId,
                name: ex.name,
                muscle_group: ex.muscleGroup || ex.group || null,
                series: ex.series || '3',
                reps: ex.reps || '12',
                load: ex.load || null,
                rest_time: ex.restTime || '60',
                notes: ex.notes || null,
                order_index: index
            }));
            
            const { error: exercisesError } = await this.client
                .from('exercises')
                .insert(exercises);
            
            if (exercisesError) throw exercisesError;
        }
        
        return true;
    }

    async deleteWorkoutSheet(sheetId) {
        if (!this.isReady()) throw new Error('Supabase não inicializado');
        
        const { error } = await this.client
            .from('workout_sheets')
            .update({ is_active: false })
            .eq('id', sheetId);
        
        if (error) throw error;
        return true;
    }

    // ---------- WORKOUT LOGS ----------
    async getWorkoutLogs(clientId) {
        if (!this.isReady()) return [];
        
        try {
            const { data, error } = await this.client
                .from('workout_logs')
                .select('*')
                .eq('client_id', clientId)
                .order('date', { ascending: false })
                .limit(30);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            return [];
        }
    }

    async createWorkoutLog(logData) {
        if (!this.isReady()) throw new Error('Supabase não inicializado');
        
        const { data, error } = await this.client
            .from('workout_logs')
            .insert({
                client_id: logData.clientId,
                sheet_id: logData.sheetId || null,
                duration_seconds: logData.durationSeconds,
                date: logData.date || new Date().toISOString().split('T')[0],
                time: logData.time || new Date().toTimeString().split(' ')[0],
                notes: logData.notes || null
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // ---------- BACKUPS ----------
    async getBackups(instructorId) {
        if (!this.isReady()) return [];
        
        try {
            const { data, error } = await this.client
                .from('backups')
                .select('*')
                .eq('instructor_id', instructorId)
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar backups:', error);
            return [];
        }
    }

    async createBackup(backupData) {
        if (!this.isReady()) throw new Error('Supabase não inicializado');
        
        const { data, error } = await this.client
            .from('backups')
            .insert({
                instructor_id: backupData.instructorId,
                backup_type: backupData.type || 'Manual',
                data: backupData.data || {},
                file_size: backupData.size || 'N/A'
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
}

// Instância global - IMPORTANTE: só cria depois que o SDK foi carregado
let DB = null;

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DB = new SupabaseClient();
    });
} else {
    // DOM já carregado
    DB = new SupabaseClient();
}
