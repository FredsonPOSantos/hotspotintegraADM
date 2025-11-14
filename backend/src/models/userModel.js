const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    nomeCompleto: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    senha: {
        type: String,
        required: true,
        minlength: 6,
    },
    telefone: {
        type: String,
        required: true,
    },
    mac: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    // NOVO CAMPO ADICIONADO
    routerName: {
        type: String,
        required: true, // Garante que este campo seja sempre guardado
    },
    dataCadastro: {
        type: Date,
        default: Date.now,
    },
    ultimoLogin: {
        type: Date,
    },
});

// Middleware para criptografar a senha ANTES de salvar o usuário
userSchema.pre('save', async function (next) {
    if (!this.isModified('senha')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});

// Método para comparar a senha enviada com a senha no banco de dados
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.senha);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

