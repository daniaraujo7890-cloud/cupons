import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET - Lista de conversas (admin vê todas, usuário vê só as suas)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let conversas

    if (user.papel === "admin") {
      conversas = await query(
        `SELECT f.id AS feedback_id, f.nome, f.email, f.assunto, f.status,
          (SELECT COUNT(*) FROM mensagens_chat WHERE feedback_id = f.id AND lida = FALSE AND remetente = 'usuario') AS nao_lidas,
          (SELECT mensagem FROM mensagens_chat WHERE feedback_id = f.id ORDER BY data DESC LIMIT 1) AS ultima_mensagem
         FROM feedback f
         ORDER BY f.timestamp DESC`
      )
    } else {
      conversas = await query(
        `SELECT f.id AS feedback_id, f.nome, f.email, f.assunto, f.status,
          (SELECT COUNT(*) FROM mensagens_chat WHERE feedback_id = f.id AND lida = FALSE AND remetente = 'admin') AS nao_lidas,
          (SELECT mensagem FROM mensagens_chat WHERE feedback_id = f.id ORDER BY data DESC LIMIT 1) AS ultima_mensagem
         FROM feedback f
         WHERE f.email = ?
         ORDER BY f.timestamp DESC`,
        [user.email]
      )
    }

    return NextResponse.json(conversas)
  } catch (error) {
    console.error("Erro ao buscar conversas:", error)
    return NextResponse.json({ error: "Erro ao buscar conversas" }, { status: 500 })
  }
}

// POST - Criar uma nova mensagem do admin para um feedback (se não existir)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.papel !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { feedbackId, mensagem } = await request.json()

    if (!mensagem || mensagem.trim() === "") {
      return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 })
    }

    // Cria uma mensagem diretamente vinculada ao feedback
    await query(
      `INSERT INTO mensagens_chat (feedback_id, remetente, mensagem, data, lida)
       VALUES (?, 'admin', ?, NOW(), FALSE)`,
      [feedbackId, mensagem]
    )

    await query(`UPDATE feedback SET status = 'respondido' WHERE id = ?`, [feedbackId])

    return NextResponse.json({ success: true, message: "Mensagem enviada com sucesso" }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar conversa:", error)
    return NextResponse.json({ error: "Erro ao criar conversa" }, { status: 500 })
  }
}
