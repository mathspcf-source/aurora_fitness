// ============================================
// AURORA FITNESS - UTILITÁRIOS
// ============================================

class Utils {
    // ---------- LOADING ----------
    static showLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            console.warn('⚠️ loadingOverlay não encontrado no DOM');
            return;
        }
        
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    // Força esconder o loading (para casos de erro)
    static hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // ---------- TOASTS ----------
    static showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.warn('⚠️ toastContainer não encontrado. Mensagem:', message);
            alert(message); // Fallback para alert
            return;
        }
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            <div class="toast-progress"></div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('removing');
                setTimeout(() => {
                    if (toast.parentElement) toast.remove();
                }, 300);
            }
        }, duration);
    }

    // ---------- MODAL DE CONFIRMAÇÃO ----------
    static confirm(message, title = 'Confirmação') {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            if (!modal) {
                resolve(window.confirm(message));
                return;
            }
            
            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').textContent = message;
            
            modal.classList.remove('hidden');
            
            const handleConfirm = () => {
                cleanup();
                resolve(true);
            };
            
            const handleCancel = () => {
                cleanup();
                resolve(false);
            };
            
            const cleanup = () => {
                modal.classList.add('hidden');
                document.getElementById('confirmOk')?.removeEventListener('click', handleConfirm);
                document.getElementById('confirmCancel')?.removeEventListener('click', handleCancel);
                document.getElementById('closeConfirmModal')?.removeEventListener('click', handleCancel);
            };
            
            document.getElementById('confirmOk')?.addEventListener('click', handleConfirm);
            document.getElementById('confirmCancel')?.addEventListener('click', handleCancel);
            document.getElementById('closeConfirmModal')?.addEventListener('click', handleCancel);
        });
    }

    // ---------- FORMATAÇÃO ----------
    static formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    static formatTime(seconds) {
        if (!seconds || seconds === 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    static generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ---------- VALIDAÇÕES ----------
    static validateRequired(value, fieldName) {
        if (!value || !value.trim()) {
            return `${fieldName} é obrigatório`;
        }
        return null;
    }

    static showFieldError(fieldId, message) {
        const errorElement = document.getElementById(fieldId + 'Error');
        const inputElement = document.getElementById(fieldId);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('visible');
        }
        
        if (inputElement) {
            inputElement.classList.add('input-error');
        }
    }

    static clearFieldError(fieldId) {
        const errorElement = document.getElementById(fieldId + 'Error');
        const inputElement = document.getElementById(fieldId);
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('visible');
        }
        
        if (inputElement) {
            inputElement.classList.remove('input-error');
        }
    }

    static clearAllFieldErrors() {
        document.querySelectorAll('.error-message.visible').forEach(el => {
            el.textContent = '';
            el.classList.remove('visible');
        });
        
        document.querySelectorAll('.input-error').forEach(el => {
            el.classList.remove('input-error');
        });
    }

    // ---------- DEBOUNCE ----------
    static debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// ============================================
// FORÇAR REMOÇÃO DO LOADING EM CASO DE ERRO
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    // Garantir que o loading suma após 5 segundos no máximo
    setTimeout(() => {
        Utils.hideLoading();
    }, 5000);
});

window.addEventListener('error', (e) => {
    console.error('Erro global capturado:', e.error);
    Utils.hideLoading();
    Utils.showToast('Erro ao carregar o sistema. Verifique o console (F12).', 'error', 8000);
});
