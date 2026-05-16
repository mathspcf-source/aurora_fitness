// ============================================
// AURORA FITNESS - CLIENTE SUPABASE
// ============================================

class SupabaseClient {
    constructor() {
        this.client = null;
        this.init();
    }

    init() {
        if (typeof supabase === 'undefined') {
            console.error('Supabase SDK não carregado. Adicione o script CDN.');
            return;
        }
        
        if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
            console.error('Configurações do Supabase não encontradas. Crie o arquivo config.js');
            return;
        }
        
        this.client = supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_KEY
        );
    }

    // ---------- PROFILES ----------
    async getProfile(userId, userType) {
        const { data, error } = await this.client
            .from('profiles')
            .select('*')
            .eq('user_type', userType)
            .eq('is_active', true)
            .single();
        
        if (error) throw error;
        return data;
    }

    async getInstructorById(instructorId) {
        const { data, error } = await this.client
            .from('profiles')
            .select('*')
            .eq('user_type', 'instructor')
            .eq('is_active', true)
            .single();
        
        if (error) return null;
        return data;
    }

    // ---------- CLIENTS ----------
    async getClients(instructorId = null) {
        let query = this.client
            .from('clients')
            .select(`
                *,
                profile:profile_id (*)
            `)
            .eq('is_active', true);
        
        if (instructorId) {
            query = query.eq('instructor_id', instructorId);
        }
        
        const { data, error } = await query.order('name');
        
        if (error) throw error;
        return data;
    }

    async getClientByCode(clientCode) {
        const { data, error } = await this.client
            .from('clients')
            .select(`
                *,
                profile:profile_id (*)
            `)
            .eq('client_code', clientCode)
            .eq('is_active', true)
            .single();
        
        if (error) return null;
        return data;
    }

    async createClient(clientData) {
        const { data, error } = await this.client
            .from('profiles')
            .insert({
                user_type: 'client',
                name: clientData.name,
                phone: clientData.phone,
                password_hash: clientData.password
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Criar registro na tabela clients
        const { data: clientRecord, error: clientError } = await this.client
            .from('clients')
            .insert({
                profile_id: data.id,
                client_code: clientData.clientCode,
                instructor_id: clientData.instructorId,
                gender: clientData.gender,
                birth_date: clientData.birthDate
            })
            .select()
            .single();
        
        if (clientError) throw clientError;
        return clientRecord;
    }

    async updateClient(clientId, clientData) {
        // Atualizar profile
        const { error: profileError } = await this.client
            .from('profiles')
            .update({
                name: clientData.name,
                phone: clientData.phone,
                password_hash: clientData.password
            })
            .eq('id', clientData.profileId);
        
        if (profileError) throw profileError;
        
        // Atualizar client
        const { data, error } = await this.client
            .from('clients')
            .update({
                gender: clientData.gender,
                birth_date: clientData.birthDate
            })
            .eq('id', clientId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async deleteClient(clientId, profileId) {
        // Soft delete na tabela clients
        const { error: clientError } = await this.client
            .from('clients')
            .update({ is_active: false })
            .eq('id', clientId);
        
        if (clientError) throw clientError;
        
        // Soft delete no profile
        const { error: profileError } = await this.client
            .from('profiles')
            .update({ is_active: false })
            .eq('id', profileId);
        
        if (profileError) throw profileError;
        
        return true;
    }

    // ---------- WORKOUT SHEETS ----------
    async getWorkoutSheets(clientId = null, instructorId = null) {
        let query = this.client
            .from('workout_sheets')
            .select(`
                *,
                exercises (*)
            `)
            .eq('is_active', true);
        
        if (clientId) {
            query = query.eq('client_id', clientId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }

    async getWorkoutSheetById(sheetId) {
        const { data, error } = await this.client
            .from('workout_sheets')
            .select(`
                *,
                exercises (*)
            `)
            .eq('id', sheetId)
            .single();
        
        if (error) throw error;
        return data;
    }

    async createWorkoutSheet(sheetData) {
        const { data, error } = await this.client
            .from('workout_sheets')
            .insert({
                client_id: sheetData.clientId,
                instructor_id: sheetData.instructorId,
                name: sheetData.name,
                type: sheetData.type,
                notes: sheetData.notes
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Inserir exercícios
        if (sheetData.exercises && sheetData.exercises.length > 0) {
            const exercises = sheetData.exercises.map((ex, index) => ({
                sheet_id: data.id,
                name: ex.name,
                muscle_group: ex.muscleGroup,
                series: ex.series,
                reps: ex.reps,
                load: ex.load,
                rest_time: ex.restTime,
                notes: ex.notes,
                order_index: index
            }));
            
            const { error: exercisesError } = await this.client
                .from('exercises')
                .insert(exercises);
            
            if (exercisesError) throw exercisesError;
        }
        
        return data;
    }

    async updateWorkoutSheet(sheetId, sheetData) {
        const { error: sheetError } = await this.client
            .from('workout_sheets')
            .update({
                name: sheetData.name,
                type: sheetData.type,
                notes: sheetData.notes
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
                muscle_group: ex.muscleGroup,
                series: ex.series,
                reps: ex.reps,
                load: ex.load,
                rest_time: ex.restTime,
                notes: ex.notes,
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
        const { error } = await this.client
            .from('workout_sheets')
            .update({ is_active: false })
            .eq('id', sheetId);
        
        if (error) throw error;
        return true;
    }

    // ---------- WORKOUT LOGS ----------
    async getWorkoutLogs(clientId) {
        const { data, error } = await this.client
            .from('workout_logs')
            .select('*')
            .eq('client_id', clientId)
            .order('date', { ascending: false })
            .limit(30);
        
        if (error) throw error;
        return data;
    }

    async createWorkoutLog(logData) {
        const { data, error } = await this.client
            .from('workout_logs')
            .insert({
                client_id: logData.clientId,
                sheet_id: logData.sheetId,
                duration_seconds: logData.durationSeconds,
                date: logData.date,
                time: logData.time,
                notes: logData.notes
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // ---------- BACKUPS ----------
    async getBackups(instructorId) {
        const { data, error } = await this.client
            .from('backups')
            .select('*')
            .eq('instructor_id', instructorId)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        return data;
    }

    async createBackup(backupData) {
        const { data, error } = await this.client
            .from('backups')
            .insert({
                instructor_id: backupData.instructorId,
                backup_type: backupData.type,
                data: backupData.data,
                file_size: backupData.size
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
}

// Instância global
const DB = new SupabaseClient();
