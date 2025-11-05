import {Router} from 'express'

import carrinhoController from '../carrinho/carrinho.controller.js'
import produtosController from '../produtos/produtos.controller.js'
import usuariosControllerAdm from '../usuarios/usuarios.controllerAdm.js'

const rotas = Router()

// Rotas de Produtos
rotas.post('/produtos',produtosController.adicionar)
rotas.get('/produtos',produtosController.listar)
rotas.put('/produtos/:id',produtosController.atualizar)
rotas.delete('/produtos/:id',produtosController.remover)

// Rotas de Carrinho
rotas.post('/adicionarItem',carrinhoController.adicionarItem)
rotas.post('/removerItem',carrinhoController.removerItem)
rotas.get('/carrinho/:usuarioId',carrinhoController.listar)
rotas.delete('/carrinho/:usuarioId',carrinhoController.remover)

// Rotas de administração de usuários
rotas.get('/usuarios',usuariosControllerAdm.listar)
rotas.post('/adicionarUsuarioAdm',usuariosControllerAdm.adicionar)

export default rotas