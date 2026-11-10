import { useEffect, useRef, useState } from "react";
import { NETWORKS } from "./network";
import type { Network } from "./types";

export type SocketStatus = "connecting" | "live" | "reconnecting" | "offline";

interface WireMessage {
  event?: string;
  topic?: string;
  data?: unknown;
  ts?: number;
  success?: boolean;
}

/**
 * One WebSocket connection per topic. Orderly sends `ping` events that must be
 * answered with `pong`, and pushes full snapshots on the topics this site uses.
 */
export function useOrderlyTopic(
  network: Network,
  topic: string | null,
  onData: (data: unknown, ts: number) => void,
): SocketStatus {
  const handlerRef = useRef(onData);
  handlerRef.current = onData;
  const [status, setStatus] = useState<SocketStatus>(topic ? "connecting" : "offline");

  useEffect(() => {
    if (!topic) {
      setStatus("offline");
      return;
    }

    let disposed = false;
    let socket: WebSocket | null = null;
    let retry = 0;
    let timer: number | null = null;

    const connect = () => {
      if (disposed) return;
      setStatus(retry === 0 ? "connecting" : "reconnecting");
      socket = new WebSocket(NETWORKS[network].ws);

      socket.onopen = () => {
        if (disposed || !socket) return;
        retry = 0;
        setStatus("live");
        socket.send(
          JSON.stringify({
            id: `desk-${Math.random().toString(36).slice(2)}`,
            event: "subscribe",
            topic,
          }),
        );
      };

      socket.onmessage = (event) => {
        let message: WireMessage;
        try {
          message = JSON.parse(String(event.data)) as WireMessage;
        } catch {
          return;
        }

        if (message.event === "ping") {
          socket?.send(JSON.stringify({ event: "pong" }));
          return;
        }

        if (message.event === "subscribe") {
          if (message.success === false) socket?.close();
          return;
        }

        if (message.topic && message.data != null) {
          handlerRef.current(message.data, typeof message.ts === "number" ? message.ts : Date.now());
        }
      };

      socket.onerror = () => socket?.close();

      socket.onclose = () => {
        if (disposed) return;
        setStatus("reconnecting");
        const delay = Math.min(10_000, 1_000 * 2 ** retry);
        retry += 1;
        timer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (timer != null) window.clearTimeout(timer);
      socket?.close();
      setStatus("offline");
    };
  }, [network, topic]);

  return status;
}
