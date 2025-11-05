import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { db } from '../database/banco-mongo.js'

class ProdutosController {
    async adicionar(req: Request, res: Response) {
        const { nome, preco, urlfoto, descricao } = req.body
        if (!nome || !preco || !urlfoto || !descricao)
            return res.status(400).json({ error: "Nome, preço, urlfoto e descrição são obrigatórios" })

        const produto = { nome, preco, urlfoto, descricao }
        const resultado = await db.collection('produtos').insertOne(produto)
        res.status(201).json({ nome, preco, urlfoto, descricao, _id: resultado.insertedId })
    }

    async listar(req: Request, res: Response) {
        const produtos = await db.collection('produtos').find().toArray()
        res.status(200).json(produtos)
    }

    async atualizar(req: Request, res: Response) {
        const id = req.params.id
        const { nome, preco, urlfoto, descricao } = req.body

        if (!id || !ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID do produto inválido' })
        }

        if (!nome || !preco || !urlfoto || !descricao) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
        }

        try {
            const resultado = await db.collection('produtos').updateOne(
                { _id: new ObjectId(id) },
                { $set: { nome, preco, urlfoto, descricao } }
            )

            if (resultado.matchedCount === 0) {
                return res.status(404).json({ error: 'Produto não encontrado' })
            }

            res.status(200).json({ _id: id, nome, preco, urlfoto, descricao })
        } catch (error) {
            console.error('Erro ao atualizar produto:', error)
            res.status(500).json({ error: 'Erro ao atualizar o produto' })
        }
    }

    async remover(req: Request, res: Response) {
        const id = req.params.id

        if (!id || !ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID do produto inválido' })
        }

        try {
            const resultado = await db.collection('produtos').deleteOne({ _id: new ObjectId(id) })

            if (resultado.deletedCount === 0) {
                return res.status(404).json({ error: 'Produto não encontrado' })
            }

            res.status(200).json({ message: 'Produto removido com sucesso' })
        } catch (error) {
            console.error('Erro ao remover produto:', error)
            res.status(500).json({ error: 'Erro ao remover o produto' })
        }
    }
}

export default new ProdutosController()