
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const ambiente = require('../config/ambiente');
const { mapUsuario } = require('../utils/mapeadoresResposta');
const { sucesso, erro } = require('../utils/apiResponse');
const { obterCampo, normalizarTipoConta } = require('../utils/requisicaoUtils');
const { normalizarCpf, motivoCpfInvalido } = require('../utils/cpfUtils');

// regex simples para e-mail — valida formato básico sem consulta externa.
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// cadastro: valida campos, verifica e-mail e cpf únicos, cria o usuário.
exports.cadastrar = async (req, res) => {
  try {
    const nome = obterCampo(req.body, ['nome']);
    const email = obterCampo(req.body, ['email']);
    const senha = obterCampo(req.body, ['senha']);
    const cpf = obterCampo(req.body, ['cpf']);
    const telefone = obterCampo(req.body, ['telefone']);
    const tipoContaRecebido = obterCampo(req.body, ['tipoConta', 'tipo_conta']);
    const areaAtuacaoRecebida = obterCampo(req.body, ['areaAtuacao', 'area_atuacao']);

    if (!nome || !email || !senha || !cpf || !tipoContaRecebido) {
      return erro(res, 400, 'Todos os campos obrigatórios devem ser preenchidos.');
    }

    if (!REGEX_EMAIL.test(String(email).trim())) {
      return erro(res, 400, 'Informe um endereço de e-mail válido.');
    }

    if (String(senha).length < 8) {
      return erro(res, 400, 'A senha deve ter pelo menos 8 caracteres.');
    }

    const cpfNormalizado = normalizarCpf(cpf);
    const erroCpf = motivoCpfInvalido(cpfNormalizado);
    if (erroCpf) {
      return erro(res, 400, erroCpf);
    }

    const tipoContaNormalizado = normalizarTipoConta(tipoContaRecebido);
    if (!tipoContaNormalizado) {
      return erro(res, 400, 'Tipo de conta inválido.');
    }

    if (tipoContaNormalizado === 'Freelancer' && !areaAtuacaoRecebida) {
      return erro(res, 400, 'Área de atuação é obrigatória para freelancers.');
    }

    // verifica e-mail e cpf ao mesmo tempo para evitar duas queries sequenciais.
    const [emailExistente, cpfExistente] = await Promise.all([
      Usuario.findOne({ email: String(email).toLowerCase().trim() }),
      Usuario.findOne({ cpf: cpfNormalizado })
    ]);

    if (emailExistente) return erro(res, 409, 'Já existe um usuário cadastrado com este e-mail.');
    if (cpfExistente) return erro(res, 409, 'Já existe um usuário cadastrado com este CPF.');

    await Usuario.create({
      nome: String(nome).trim(),
      email: String(email).toLowerCase().trim(),
      senha: await bcrypt.hash(String(senha), 10),
      cpf: cpfNormalizado,
      telefone: telefone ? String(telefone).trim() : '',
      tipoConta: tipoContaNormalizado,
      areaAtuacao: tipoContaNormalizado === 'Freelancer' ? String(areaAtuacaoRecebida || '').trim() : ''
    });

    return sucesso(res, 201, 'Cadastro realizado com sucesso!');
  } catch (error) {
    if (error?.code === 11000) {
      if (error.keyPattern?.cpf || error.keyValue?.cpf) {
        return erro(res, 409, 'Já existe um usuário cadastrado com este CPF.');
      }
      if (error.keyPattern?.email || error.keyValue?.email) {
        return erro(res, 409, 'Já existe um usuário cadastrado com este e-mail.');
      }
    }

    console.error(error);
    return erro(res, 500, 'Erro ao cadastrar usuário.');
  }
};

// login: retorna 401 genérico em ambos os casos (e-mail não encontrado ou senha errada)
// para não revelar se o e-mail existe no sistema.
exports.entrar = async (req, res) => {
  try {
    const email = obterCampo(req.body, ['email']);
    const senha = obterCampo(req.body, ['senha']);

    if (!email || !senha) {
      return erro(res, 400, 'E-mail e senha são obrigatórios.');
    }

    const usuario = await Usuario.findOne({ email: String(email).toLowerCase().trim() });
    const senhaCorreta = usuario ? await bcrypt.compare(String(senha), usuario.senha) : false;

    if (!usuario || !senhaCorreta) {
      return erro(res, 401, 'Credenciais inválidas.');
    }

    const token = jwt.sign(
      { id_usuario: usuario._id.toString(), nome: usuario.nome, tipo: usuario.tipoConta },
      ambiente.jwtSecret,
      { expiresIn: '7d' }
    );

    return sucesso(res, 200, 'Login realizado com sucesso.', null, {
      token,
      user: mapUsuario(req, usuario)
    });
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro no servidor.');
  }
};

exports.register = exports.cadastrar;

exports.login = exports.entrar;
