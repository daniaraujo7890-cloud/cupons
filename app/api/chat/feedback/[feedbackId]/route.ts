import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { feedbackId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const feedbackId = params.feedbackId

    const mensagens = await query(
      `SELECT id, feedback_id, remetente, mensagem, data, lida
       FROM mensagens_chat
       WHERE feedback_id = ?
       ORDER BY data ASC`,
      [feedbackId]
    )

    const outroRemetente = user.papel === "admin" ? "usuario" : "admin"

    await query(
      `UPDATE mensagens_chat
       SET lida = TRUE
       WHERE feedback_id = ? AND remetente = ? AND lida = FALSE`,
      [feedbackId, outroRemetente]
    )

    if (user.papel === "admin") {
      await query(
        `UPDATE feedback SET status = 'lido' WHERE id = ? AND status = 'novo'`,
        [feedbackId]
      )
    }

    return NextResponse.json({ mensagens }, { status: 200 })
  } catch (error) {
    console.error("❌ Erro ao buscar mensagens:", error)
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { feedbackId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const feedbackId = params.feedbackId
    const { mensagem } = await request.json()

    if (!mensagem || mensagem.trim() === "") {
      return NextResponse.json({ error: "Mensagem não pode estar vazia" }, { status: 400 })
    }

    const remetente = user.papel === "admin" ? "admin" : "usuario"

    const result: any = await query(
      `INSERT INTO mensagens_chat (feedback_id, remetente, mensagem, data, lida)
       VALUES (?, ?, ?, NOW(), FALSE)`,
      [feedbackId, remetente, mensagem]
    )

    if (user.papel === "admin") {
      await query(`UPDATE feedback SET status = 'respondido' WHERE id = ?`, [feedbackId])
    } else {
      await query(`UPDATE feedback SET status = 'novo' WHERE id = ?`, [feedbackId])
    }

    const [novaMensagem] = await query(
      `SELECT id, feedback_id, remetente, mensagem, data, lida
       FROM mensagens_chat
       WHERE id = ?`,
      [result.insertId]
    )

    if (global.io) {
      global.io.to(`feedback_${feedbackId}`).emit("nova_mensagem", novaMensagem)
      console.log(`📡 Mensagem emitida via Socket.IO para feedback_${feedbackId}`)
    }

    return NextResponse.json({ success: true, mensagem: novaMensagem }, { status: 201 })
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
  }
}
