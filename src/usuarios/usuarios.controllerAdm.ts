import { Request, Response } from 'express'
import { db } from '../database/banco-mongo.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { ObjectId } from 'mongodb'

interface Usuario {
    _id: any;
    nome: string;
    email: string;
    senha: string;
    isAdmin?: boolean;
}

class UsuariosControllerAdm {
    async adicionar(req: Request, res: Response) {
        const { nome, idade, email, senha } = req.body
        if (!nome || !idade || !email || !senha)
            return res.status(400).json({ error: "Nome, idade, email e senha são obrigatórios" })
        if (senha.length < 6)
            return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" })
        if (!email.includes('@') || !email.includes('.'))
            return res.status(400).json({ error: "Email inválido" })

        // Verificar se já existe um usuário com este email
        const usuarioExistente = await db.collection('usuarios').findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ error: "Já existe um usuário com este email" });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10)
        const usuario = { 
            nome, 
            idade, 
            email, 
            senha: senhaCriptografada, 
            isAdmin: true, // Garante que o usuário criado é admin
            dataCriacao: new Date()
        }

        const resultado = await db.collection('usuarios').insertOne(usuario)
        res.status(201).json({
            _id: resultado.insertedId,
            nome,
            idade,
            email,
            isAdmin: true
        })
    }

    async listar(req: Request, res: Response) {
        const usuarios = await db.collection('usuarios').find().toArray()
        const usuariosSemSenha = usuarios.map(({ senha, ...resto }) => resto)
        res.status(200).json(usuariosSemSenha)
    }

    async atualizar(req: Request, res: Response) {
        const { id } = req.params;
        const { nome, email, idade } = req.body;

        if (!id) {
            return res.status(400).json({ error: "ID do usuário é obrigatório" });
        }

        try {
            const atualizacao: any = {};
            if (nome) atualizacao.nome = nome;
            if (email) atualizacao.email = email;
            if (idade !== undefined) atualizacao.idade = idade;

            if (Object.keys(atualizacao).length === 0) {
                return res.status(400).json({ error: "Nenhum dado para atualizar" });
            }

            const resultado = await db.collection('usuarios').updateOne(
                { _id: new ObjectId(id) },
                { $set: atualizacao }
            );

            if (resultado.matchedCount === 0) {
                return res.status(404).json({ error: "Usuário não encontrado" });
            }

            res.status(200).json({ mensagem: "Usuário atualizado com sucesso" });
        } catch (error: any) {
            console.error("Erro ao atualizar usuário:", error);
            res.status(500).json({ 
                error: "Erro ao atualizar usuário",
                detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async remover(req: Request, res: Response) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "ID do usuário é obrigatório" });
        }

        try {
            // Verificar se o usuário existe
            const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });
            
            if (!usuario) {
                return res.status(404).json({ error: "Usuário não encontrado" });
            }

            // Não permitir que um administrador se remova
            if (usuario.isAdmin) {
                return res.status(403).json({ error: "Não é permitido remover um administrador" });
            }

            // Remover o usuário
            const resultado = await db.collection('usuarios').deleteOne({ _id: new ObjectId(id) });

            if (resultado.deletedCount === 0) {
                return res.status(404).json({ error: "Usuário não encontrado" });
            }

            res.status(200).json({ mensagem: "Usuário removido com sucesso" });
        } catch (error: any) {
            console.error("Erro ao remover usuário:", error);
            res.status(500).json({ 
                error: "Erro ao remover usuário",
                detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async login(req: Request, res: Response) {
        console.log('Iniciando processo de login administrativo');
        console.log('Dados recebidos:', { email: req.body.email, senha: '***' });
        
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            console.log('Email ou senha não fornecidos');
            return res.status(400).json({ mensagem: "Email e senha são obrigatórios!" });
        }

        try {
            // Buscar usuário no banco de dados
            console.log('Buscando usuário no banco de dados...');
            const usuario = await db.collection<Usuario>('usuarios').findOne({ email });
            console.log('Usuário encontrado:', usuario ? { ...usuario, senha: '***' } : 'Nenhum usuário encontrado');

            if (!usuario) {
                console.log('Usuário não encontrado');
                return res.status(401).json({ mensagem: "Credenciais inválidas" });
            }

            // Verificar se o usuário é administrador
            console.log('Verificando se o usuário é administrador...');
            console.log('isAdmin:', usuario.isAdmin);
            
            if (!usuario.isAdmin) {
                console.log('Acesso negado: usuário não é administrador');
                return res.status(403).json({ 
                    mensagem: "Acesso negado. Área restrita a administradores.",
                    isAdmin: false
                });
            }

            // Verificar a senha
            console.log('Verificando senha...');
            const senhaValida = await bcrypt.compare(senha, usuario.senha);
            
            if (!senhaValida) {
                console.log('Senha inválida');
                return res.status(401).json({ 
                    mensagem: "Credenciais inválidas",
                    codigo: "SENHA_INVALIDA"
                });
            }

            // Verificar se o JWT_SECRET está definido
            if (!process.env.JWT_SECRET) {
                console.error('ERRO: JWT_SECRET não está definido no ambiente');
                return res.status(500).json({ mensagem: "Erro interno no servidor" });
            }

            // Gerar token JWT
            console.log('Gerando token JWT...');
            const token = jwt.sign(
                { 
                    usuarioId: usuario._id,
                    isAdmin: true,
                    email: usuario.email
                }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1h' }
            );

            console.log('Login administrativo bem-sucedido');
            res.status(200).json({
                token,
                usuario: {
                    _id: usuario._id,
                    nome: usuario.nome,
                    email: usuario.email,
                    isAdmin: true
                }
            });
            
        } catch (error: any) {
            console.error('Erro durante o login administrativo:', error);
            res.status(500).json({ 
                mensagem: "Erro interno no servidor",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

export default new UsuariosControllerAdm()