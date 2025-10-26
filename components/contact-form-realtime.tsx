"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mail, Phone, MapPin, Send, CheckCircle, MessageSquare } from "lucide-react"
import { io, Socket } from "socket.io-client"

interface Mensagem {
  id: number
  feedback_id: number
  remetente: "usuario" | "admin"
  mensagem: string
  data: string
  lida: boolean
}

export function ContactFormRealtime() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chatAtivo, setChatAtivo] = useState(false)
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [enviandoMensagem, setEnviandoMensagem] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [mensagens])

  useEffect(() => {
    if (chatAtivo && feedbackId) {
      const socketInstance = io({
        path: "/api/socketio",
      })

      socketInstance.on("connect", () => {
        console.log("✅ Conectado ao Socket.IO")
        socketInstance.emit("join_feedback", feedbackId)
      })

      socketInstance.on("nova_mensagem", (mensagem: Mensagem) => {
        console.log("📨 Nova mensagem recebida:", mensagem)
        setMensagens((prev) => {
          const existe = prev.some((m) => m.id === mensagem.id)
          if (existe) return prev
          return [...prev, mensagem]
        })
      })

      socketInstance.on("disconnect", () => {
        console.log("❌ Desconectado do Socket.IO")
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.emit("leave_feedback", feedbackId)
        socketInstance.disconnect()
      }
    }
  }, [chatAtivo, feedbackId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const nome = formData.get("name")
    const email = formData.get("email")
    const telefone = formData.get("phone")
    const assunto = formData.get("subject")
    const mensagem = formData.get("message")

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, telefone, assunto, mensagem }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Erro ao enviar feedback")

      setFeedbackId(data.feedbackId)
      setChatAtivo(true)
      await carregarMensagens(data.feedbackId)
      setSubmitted(true)
    } catch (error) {
      console.error("Erro ao enviar feedback:", error)
      alert("❌ Não foi possível enviar sua mensagem. Tente novamente mais tarde.")
    } finally {
      setLoading(false)
    }
  }

  const carregarMensagens = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/feedback/${id}`)
      if (response.ok) {
        const data = await response.json()
        setMensagens(data.mensagens || [])
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error)
    }
  }

  const enviarMensagemChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaMensagem.trim() || enviandoMensagem || !feedbackId) return

    setEnviandoMensagem(true)
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
      setEnviandoMensagem(false)
    }
  }

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-balance">Entre em Contato</h1>
          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Tem alguma dúvida ou sugestão? Estamos aqui para ajudar!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="space-y-6">
            <Card className="group hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-foreground">Email</h3>
                    <p className="text-sm text-muted-foreground">contato@linuxcupons.com.br</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-foreground">Telefone</h3>
                    <p className="text-sm text-muted-foreground">(11) 9999-9999</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-foreground">Endereço</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Av. Paulista, 1000
                      <br />
                      São Paulo - SP
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-dashed">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 text-foreground">Horário de Atendimento</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Segunda a Sexta: 9h às 18h
                  <br />
                  Sábado: 9h às 13h
                  <br />
                  Domingo: Fechado
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {chatAtivo ? (
                    <>
                      <MessageSquare className="h-6 w-6" />
                      Chat ao Vivo
                    </>
                  ) : (
                    "Envie sua Mensagem"
                  )}
                </CardTitle>
                <CardDescription>
                  {chatAtivo ? "Continue a conversa com nossa equipe" : "Responderemos em até 24 horas úteis"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!chatAtivo && !submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" name="name" placeholder="Seu nome" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="(11) 99999-9999" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Assunto</Label>
                        <Select name="subject">
                          <SelectTrigger id="subject">
                            <SelectValue placeholder="Selecione um assunto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="support">Suporte Técnico</SelectItem>
                            <SelectItem value="billing">Dúvidas sobre Planos</SelectItem>
                            <SelectItem value="partnership">Parcerias</SelectItem>
                            <SelectItem value="suggestion">Sugestões</SelectItem>
                            <SelectItem value="other">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Escreva sua mensagem aqui..."
                        rows={6}
                        required
                        className="resize-none"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                      {loading ? (
                        <span className="animate-pulse">Enviando...</span>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                ) : chatAtivo ? (
                  <div className="space-y-4">
                    <div className="h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4 bg-muted/20">
                      {mensagens.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>Aguardando resposta...</p>
                        </div>
                      ) : (
                        mensagens.map((msg) => {
                          const isAdmin = msg.remetente === "admin"
                          return (
                            <div key={msg.id} className={`flex gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{isAdmin ? "A" : "U"}</AvatarFallback>
                              </Avatar>
                              <div className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} max-w-[70%]`}>
                                <span className="text-xs text-muted-foreground mb-1">
                                  {isAdmin ? "Atendente" : "Você"}
                                </span>
                                <div
                                  className={`rounded-lg px-3 py-2 ${
                                    isAdmin ? "bg-primary text-primary-foreground" : "bg-background border"
                                  }`}
                                >
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
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={enviarMensagemChat} className="flex gap-2">
                      <Input
                        value={novaMensagem}
                        onChange={(e) => setNovaMensagem(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        disabled={enviandoMensagem}
                      />
                      <Button type="submit" size="icon" disabled={enviandoMensagem || !novaMensagem.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-4 animate-slide-in">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground">Mensagem Enviada!</h3>
                    <p className="text-muted-foreground">Chat iniciado! Continue a conversa abaixo.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
