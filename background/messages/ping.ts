import type { PlasmoMessaging } from "@plasmohq/messaging"

export interface PingRequest {
  message?: string
}

export interface PingResponse {
  message: string
  timestamp: number
}

const handler: PlasmoMessaging.MessageHandler<
  PingRequest,
  PingResponse
> = async (req, res) => {
  console.log("Background: Received ping message:", req.body)

  res.send({
    message: `Pong! ${req.body?.message || "Hello from background"}`,
    timestamp: Date.now()
  })
}

export default handler
