"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Send, X, CheckCircle } from "lucide-react"
import { io, Socket } from "socket.io-client"

interface Mensagem {
  id: number
  feedback_id: number
  remetente: "usuario" | "admin"
  mensagem: string
  data: string
  lida: boolean
}

interface ChatWindowRealtimeProps {
  feedbackId: string
  titulo: string
  onClose: () => void
  onFinalizar?: () => void
}

export function ChatWindowRealtime({ feedbackId, titulo, onClose, onFinalizar }: ChatWindowRealtimeProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [mensagens])

  useEffect(() => {
    carregarMensagens()

    const socketInstance = io({
      path: "/api/socketio",
    })

    socketInstance.on("connect", () => {
      console.log("✅ Admin conectado ao Socket.IO")
      socketInstance.emit("join_feedback", feedbackId)
    })

    socketInstance.on("nova_mensagem", (mensagem: Mensagem) => {
      console.log("📨 Nova mensagem recebida no admin:", mensagem)
      setMensagens((prev) => {
        const existe = prev.some((m) => m.id === mensagem.id)
        if (existe) return prev
        return [...prev, mensagem]
      })
    })

    socketInstance.on("disconnect", () => {
      console.log("❌ Admin desconectado do Socket.IO")
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.emit("leave_feedback", feedbackId)
      socketInstance.disconnect()
    }
  }, [feedbackId])

  const carregarMensagens = async () => {
    try {
      const response = await fetch(`/api/chat/feedback/${feedbackId}`)
      if (response.ok) {
        const data = await response.json()
        setMensagens(data.mensagens || [])
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error)
    }
  }

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaMensagem.trim() || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/chat/feedback/${feedbackId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: novaMensagem }),
      })

      if (response.ok) {
        setNovaMensagem("")
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] flex flex-col shadow-2xl z-50">
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
        <h3 className="font-semibold truncate">{titulo}</h3>
        <div className="flex gap-1">
          {onFinalizar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onFinalizar}
              className="h-8 w-8 hover:bg-primary-foreground/20"
              title="Finalizar Conversa"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-primary-foreground/20">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.map((msg) => {
          const isAdmin = msg.remetente === "admin"
          return (
            <div key={msg.id} className={`flex gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback>{isAdmin ? "A" : "U"}</AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} max-w-[70%]`}>
                <span className="text-xs text-muted-foreground mb-1">{isAdmin ? "Admin" : "Usuário"}</span>
                <div className={`rounded-lg px-3 py-2 ${isAdmin ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p className="text-sm">{msg.mensagem}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.data).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={enviarMensagem} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !novaMensagem.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  )
}
