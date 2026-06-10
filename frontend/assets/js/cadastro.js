// script para página de cadastro: lida com campos dinâmicos, validações, máscara de CPF e comunicação com a API para criar conta.

document.addEventListener('DOMContentLoaded', function () {
    const tipoConta = document.getElementById('tipo_conta');
    const areaAtuacaoGroup = document.getElementById('area-atuacao-group');
    const areaAtuacao = document.getElementById('area_atuacao');
    const cpfInput = document.getElementById('cpf');
    const form = document.getElementById('formCadastro');
    const submitButton = form?.querySelector('[type="submit"]');

    const showAlertSafe = (options) => {
        if (window.Workly?.showAlert) return window.Workly.showAlert(options);
        alert(options?.text || options?.title || 'Aviso');
        return Promise.resolve();
    };

    const apiFetchSafe = (path, options) => {
        if (window.Workly?.apiFetch) return window.Workly.apiFetch(path, options);
        const base = window.API_BASE || 'http://localhost:3000';
        return fetch(`${base}${path}`, options).then(async (response) => {
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.mensagem || data.message || 'Erro na requisição.');
            return data;
        });
    };

    if (!tipoConta || !areaAtuacaoGroup || !form) {
        console.error('Elementos essenciais do formulário não encontrados');
        return;
    }

    function onlyDigits(value = '') {
        return String(value).replace(/\D/g, '').slice(0, 11);
    }

    function formatCpf(value = '') {
        const digits = onlyDigits(value);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
        if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    }

    function isRepeatedCpf(digits) {
        return /^(\d)\1{10}$/.test(digits);
    }


    function validateCpf(value) {
        const digits = onlyDigits(value);

        // Validação simplificada para apresentação do PI.
        // Permite CPF sequencial e não confere dígito verificador.
        // Bloqueia apenas tamanho incorreto e CPF com todos os números iguais.
        // CPF duplicado continua sendo bloqueado pelo backend/banco.
        if (!digits) return { valid: false, message: 'CPF é obrigatório' };
        if (digits.length !== 11) return { valid: false, message: 'CPF deve ter 11 números' };
        if (isRepeatedCpf(digits)) return { valid: false, message: 'CPF não pode ter todos os números iguais' };

        return { valid: true, message: '' };
    }

    function updateAreaAtuacaoVisibility() {
        if (tipoConta.value === 'Freelancer') {
            areaAtuacaoGroup.style.display = 'block';
            areaAtuacao?.setAttribute('required', '');
        } else {
            areaAtuacaoGroup.style.display = 'none';
            if (areaAtuacao) {
                areaAtuacao.removeAttribute('required');
                areaAtuacao.value = '';
            }
        }
    }

    function ensureErrorMessage(formGroup) {
        let errorMessage = formGroup.querySelector('small');
        if (!errorMessage) {
            errorMessage = document.createElement('small');
            formGroup.appendChild(errorMessage);
        }
        return errorMessage;
    }

    function setFieldState(field, state, message = '') {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        const errorMessage = ensureErrorMessage(formGroup);
        formGroup.classList.remove('error', 'success');
        errorMessage.textContent = message;
        errorMessage.style.display = message ? 'block' : 'none';

        if (state) formGroup.classList.add(state);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validateField(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return true;

        setFieldState(field, '');

        if (field.type === 'checkbox') {
            if (field.required && !field.checked) {
                setFieldState(field, 'error', 'Este campo é obrigatório');
                return false;
            }
            setFieldState(field, 'success');
            return true;
        }

        if (field.id === 'cpf') {
            field.value = formatCpf(field.value);
            const cpfValidation = validateCpf(field.value);

            if (!cpfValidation.valid) {
                setFieldState(field, 'error', cpfValidation.message);
                return false;
            }

            setFieldState(field, 'success');
            return true;
        }

        const value = field.value.trim();
        if (field.required && !value) {
            setFieldState(field, 'error', 'Este campo é obrigatório');
            return false;
        }

        if (field.type === 'email' && value && !isValidEmail(value)) {
            setFieldState(field, 'error', 'Por favor, insira um email válido');
            return false;
        }

        if (field.id === 'senha' && value && value.length < 8) {
            setFieldState(field, 'error', 'A senha deve ter pelo menos 8 caracteres');
            return false;
        }

        if (field.id === 'confirmar_senha') {
            const senha = document.getElementById('senha').value.trim();
            if (value && senha && value !== senha) {
                setFieldState(field, 'error', 'As senhas não coincidem');
                return false;
            }
        }

        setFieldState(field, 'success');
        return true;
    }

    updateAreaAtuacaoVisibility();

    tipoConta.addEventListener('change', function () {
        updateAreaAtuacaoVisibility();
        validateField(this);
    });

    if (cpfInput) {
        cpfInput.addEventListener('input', function () {
            this.value = formatCpf(this.value);
        });
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        let hasError = false;
        form.querySelectorAll('input, select').forEach(field => {
            if (field.type === 'checkbox' && field.id !== 'termos') return;
            if (!validateField(field)) hasError = true;
        });

        const senha = document.getElementById('senha').value.trim();
        const confirmarSenha = document.getElementById('confirmar_senha').value.trim();
        const termos = document.getElementById('termos').checked;

        if (senha !== confirmarSenha || !termos) {
            hasError = true;
        }

        if (hasError) {
            showAlertSafe({
                icon: 'warning',
                title: 'Revise o formulário',
                text: 'Preencha os campos obrigatórios corretamente antes de continuar.',
                confirmText: 'Entendi'
            });
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        delete data.newsletter;
        delete data.termos;

        if (tipoConta.value !== 'Freelancer') {
            delete data.area_atuacao;
        }

        data.cpf = onlyDigits(data.cpf);
        data.tipoConta = data.tipo_conta;
        data.areaAtuacao = data.area_atuacao;

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.dataset.originalText = submitButton.textContent;
                submitButton.textContent = 'Criando conta...';
            }

            const resultado = await apiFetchSafe('/api/autenticacao/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            await showAlertSafe({
                icon: 'success',
                title: 'Perfil criado com sucesso!',
                text: resultado.mensagem || 'Sua conta foi criada. Agora é só fazer login e começar.',
                confirmText: 'Ir para login'
            });

            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro ao conectar:', error);
            showAlertSafe({
                icon: 'error',
                title: 'Não foi possível concluir o cadastro',
                text: error.message || 'Falha de conexão. Tente novamente em instantes.',
                confirmText: 'Fechar'
            });
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = submitButton.dataset.originalText || 'Criar Conta';
            }
        }
    });

    form.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('blur', function () { validateField(this); });
        field.addEventListener('change', function () { validateField(this); });
    });
});
