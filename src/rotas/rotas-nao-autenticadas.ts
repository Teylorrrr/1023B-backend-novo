import {Router} from 'express'

import produtosController from '../produtos/produtos.controller.js'
import usuariosController from '../usuarios/usuarios.controller.js'
import usuariosControllerAdm from '../usuarios/usuarios.controllerAdm.js'

const rotas = Router()

// Rotas públicas de usuários comuns
rotas.post('/adicionarUsuario', usuariosController.adicionar)
rotas.post('/login', usuariosController.login)

// Rota de login administrativo
rotas.post('/admin/login', usuariosControllerAdm.login)

export default rotas