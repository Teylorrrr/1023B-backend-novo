import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/banco-mongo.js';

interface AutenticacaoRequest extends Request {
    usuarioId?: string;
}

export default async function isAdmin(req: AutenticacaoRequest, res: Response, next: NextFunction) {
    try {
        const authHeaders = req.headers.authorization;
        if (!authHeaders) {
            return res.status(401).json({ mensagem: "Token não fornecido" });
        }

        const token = authHeaders.split(" ")[1];
        if (!token) {
            return res.status(401).json({ mensagem: "Token inválido" });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        
        // Buscar usuário no banco de dados para verificar se é admin
        const usuario = await db.collection('usuarios').findOne({ _id: decoded.usuarioId });
        
        if (!usuario) {
            return res.status(401).json({ mensagem: "Usuário não encontrado" });
        }

        if (!usuario.isAdmin) {
            return res.status(403).json({ mensagem: "Acesso negado. Você não é um administrador." });
        }

        // Se chegou até aqui, o usuário é admin
        req.usuarioId = decoded.usuarioId;
        next();
    } catch (error) {
        console.error('Erro na verificação de admin:', error);
        return res.status(401).json({ mensagem: "Token inválido ou expirado" });
    }
}
