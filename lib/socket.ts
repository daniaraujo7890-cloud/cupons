import { Server as HTTPServer } from "http"
import { Server as SocketIOServer } from "socket.io"

let io: SocketIOServer | null = null

export function initSocket(server: HTTPServer) {
  if (io) {
    return io
  }

  io = new SocketIOServer(server, {
    path: "/api/socketio",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log(`✅ Cliente conectado: ${socket.id}`)

    socket.on("join_feedback", (feedbackId: string) => {
      socket.join(`feedback_${feedbackId}`)
      console.log(`📥 Socket ${socket.id} entrou na sala: feedback_${feedbackId}`)
    })

    socket.on("leave_feedback", (feedbackId: string) => {
      socket.leave(`feedback_${feedbackId}`)
      console.log(`📤 Socket ${socket.id} saiu da sala: feedback_${feedbackId}`)
    })

    socket.on("disconnect", () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`)
    })
  })

  return io
}

export function getIO(): SocketIOServer | null {
  if (!io) {
    console.warn("⚠️ Socket.IO não foi inicializado ainda")
  }
  return io
}

export function emitToFeedback(feedbackId: string, event: string, data: any) {
  if (!io) {
    console.warn("⚠️ Socket.IO não disponível")
    return
  }
  io.to(`feedback_${feedbackId}`).emit(event, data)
  console.log(`📡 Evento '${event}' enviado para feedback_${feedbackId}`)
}
