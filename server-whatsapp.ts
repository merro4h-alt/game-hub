import fs from "fs";
import path from "path";

const importEsm = new Function("modulePath", "return import(modulePath)") as (
  modulePath: string
) => Promise<any>;

const AUTH_BASE_DIR = path.join(process.cwd(), ".whatsapp-auth");
const SESSION_DIR = path.join(AUTH_BASE_DIR, "session");
const QUEUE_FILE = path.join(AUTH_BASE_DIR, "pending-queue.json");

export const DEFAULT_STORE_WA_PHONE = "07837814009";

export type WhatsAppDirectStatus =
  | "disconnected"
  | "connecting"
  | "qr_ready"
  | "pairing_code_ready"
  | "connected";

interface QueuedWhatsAppNotification {
  id: string;
  recipientDigits: string;
  message: string;
  createdAt: string;
}

let activeSock: any = null;
let connectionStatus: WhatsAppDirectStatus = "disconnected";
let currentQrDataUrl: string | null = null;
let currentPairingCode: string | null = null;
let currentPairingPhone: string | null = null;
let connectedPhone: string | null = null;
let lastError: string | null = null;
let isManualReset = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let sendWelcomeOnNextOpen = false;

function ensureDirs() {
  if (!fs.existsSync(AUTH_BASE_DIR)) {
    fs.mkdirSync(AUTH_BASE_DIR, { recursive: true });
  }
}

export function normalizePhoneDigits(rawInput?: string): string {
  const rawWa = String(
    rawInput ||
      process.env.TWILIO_WHATSAPP_TO ||
      process.env.WHATSAPP_NUMBER ||
      DEFAULT_STORE_WA_PHONE
  ).replace(/^whatsapp:/i, "");
  let cleanDigits = rawWa.replace(/[^\d]/g, "");
  if (cleanDigits.startsWith("00")) cleanDigits = cleanDigits.slice(2);
  if (cleanDigits.startsWith("07") && cleanDigits.length === 11) {
    cleanDigits = "964" + cleanDigits.slice(1);
  } else if (cleanDigits.startsWith("7") && cleanDigits.length === 10) {
    cleanDigits = "964" + cleanDigits;
  } else if (cleanDigits.startsWith("05") && cleanDigits.length === 10) {
    cleanDigits = "966" + cleanDigits.slice(1);
  }
  return cleanDigits.length >= 8 ? cleanDigits : "9647837814009";
}

function readPendingQueue(): QueuedWhatsAppNotification[] {
  try {
    ensureDirs();
    if (!fs.existsSync(QUEUE_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writePendingQueue(items: QueuedWhatsAppNotification[]) {
  try {
    ensureDirs();
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(items.slice(-50), null, 2), "utf8");
  } catch (err) {
    console.error("[WhatsApp Direct] Failed writing pending queue:", err);
  }
}

export function enqueueWhatsAppNotification(
  id: string,
  rawRecipient: string | undefined,
  message: string
) {
  const recipientDigits = normalizePhoneDigits(rawRecipient);
  const queue = readPendingQueue();
  if (queue.some((item) => item.id === id)) return;
  queue.push({
    id,
    recipientDigits,
    message,
    createdAt: new Date().toISOString(),
  });
  writePendingQueue(queue);
}

export function getPendingQueueCount(): number {
  return readPendingQueue().length;
}

function clearSessionFiles() {
  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }
  } catch (err) {
    console.error("[WhatsApp Direct] Error clearing session files:", err);
  }
}

function hasSavedRegisteredSession(): boolean {
  try {
    const credsPath = path.join(SESSION_DIR, "creds.json");
    if (!fs.existsSync(credsPath)) return false;
    const creds = JSON.parse(fs.readFileSync(credsPath, "utf8"));
    return Boolean(creds && (creds.registered || creds.me));
  } catch {
    return false;
  }
}

async function resolveCandidateJids(
  sock: any,
  cleanDigits: string
): Promise<string[]> {
  const candidates: string[] = [];
  const selfDigits = connectedPhone ? connectedPhone.replace(/[^\d]/g, "") : "";

  let jidNormalizedUserFn: ((jid: string | undefined) => string) | null = null;
  try {
    const baileys = await importEsm("@whiskeysockets/baileys");
    if (typeof baileys.jidNormalizedUser === "function") {
      jidNormalizedUserFn = baileys.jidNormalizedUser;
    }
  } catch {
    // fallback to manual normalization
  }

  // 1. Primary: verified WhatsApp phone JID (or normalized self phone JID when sending to linked store phone)
  if (selfDigits && selfDigits === cleanDigits) {
    const normalizedSelf =
      (jidNormalizedUserFn && sock.user?.id ? jidNormalizedUserFn(sock.user.id) : "") ||
      `${cleanDigits}@s.whatsapp.net`;
    if (normalizedSelf && !candidates.includes(normalizedSelf)) {
      candidates.push(normalizedSelf);
    }

    const directPnJid = `${cleanDigits}@s.whatsapp.net`;
    if (!candidates.includes(directPnJid)) {
      candidates.push(directPnJid);
    }

    if (sock.user?.lid) {
      const baseLid = String(sock.user.lid).split(":")[0];
      const normalizedLid = baseLid.includes("@") ? baseLid : `${baseLid}@lid`;
      if (!candidates.includes(normalizedLid)) {
        candidates.push(normalizedLid);
      }
    }
  } else {
    try {
      const results = await sock.onWhatsApp(cleanDigits);
      if (Array.isArray(results) && results[0]?.jid && !candidates.includes(results[0].jid)) {
        candidates.push(results[0].jid);
      }
    } catch {
      // Fallback below
    }

    const directPnJid = `${cleanDigits}@s.whatsapp.net`;
    if (!candidates.includes(directPnJid)) {
      candidates.push(directPnJid);
    }

    if (sock.user?.id) {
      const selfBase = String(sock.user.id).split(":")[0];
      const selfJid = selfBase.includes("@") ? selfBase : `${selfBase}@s.whatsapp.net`;
      if (!candidates.includes(selfJid)) {
        candidates.push(selfJid);
      }
    }
  }

  return candidates;
}

export async function sendViaDirectWhatsApp(
  rawRecipient: string | undefined,
  messageBody: string
): Promise<{ sent: boolean; recipient: string; error?: string }> {
  const cleanDigits = normalizePhoneDigits(rawRecipient);
  const displayRecipient = `+${cleanDigits}`;

  if (connectionStatus !== "connected" || !activeSock) {
    return {
      sent: false,
      recipient: displayRecipient,
      error: "WHATSAPP_DIRECT_NOT_CONNECTED",
    };
  }

  const candidateJids = await resolveCandidateJids(activeSock, cleanDigits);
  let lastSendErr = "SEND_FAILED";

  for (const jid of candidateJids) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await activeSock.sendMessage(jid, { text: messageBody });
        console.log(`[WhatsApp Direct] Delivered notification to +${cleanDigits} via ${jid}`);
        return { sent: true, recipient: displayRecipient };
      } catch (err: any) {
        lastSendErr = err?.message || String(err);
        console.error(
          `[WhatsApp Direct] Send attempt ${attempt} to ${jid} error:`,
          lastSendErr
        );
        if (attempt === 1 && connectionStatus === "connected" && activeSock) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
      }
    }
  }

  return { sent: false, recipient: displayRecipient, error: lastSendErr };
}

export async function flushPendingNotificationsNow(): Promise<{
  delivered: number;
  remaining: number;
}> {
  if (connectionStatus !== "connected" || !activeSock) {
    return { delivered: 0, remaining: getPendingQueueCount() };
  }
  const queue = readPendingQueue();
  if (queue.length === 0) {
    return { delivered: 0, remaining: 0 };
  }

  console.log(`[WhatsApp Direct] Flushing ${queue.length} queued WhatsApp notifications...`);
  const remaining: QueuedWhatsAppNotification[] = [];
  let delivered = 0;

  for (const item of queue) {
    const res = await sendViaDirectWhatsApp(item.recipientDigits, item.message);
    if (res.sent) {
      delivered++;
    } else {
      remaining.push(item);
    }
  }

  writePendingQueue(remaining);
  return { delivered, remaining: remaining.length };
}

async function createWhatsAppSocket(options?: {
  pairingPhoneDigits?: string;
  onReady?: () => void;
}) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  ensureDirs();
  const baileys = await importEsm("@whiskeysockets/baileys");
  const pinoMod = await importEsm("pino");
  const QRCodeMod = await importEsm("qrcode");
  const pino = pinoMod.default || pinoMod;
  const QRCode = QRCodeMod.default || QRCodeMod;

  const {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
  } = baileys;

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  let version: [number, number, number] | undefined;
  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest.version;
  } catch {
    // Use built-in default version if version check fails
  }

  connectionStatus = "connecting";
  lastError = null;

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  activeSock = sock;
  let pairingRequested = false;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update: any) => {
    if (activeSock !== sock) return;

    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      if (options?.pairingPhoneDigits && !state.creds.registered) {
        if (!pairingRequested) {
          pairingRequested = true;
          try {
            const rawCode: string = await sock.requestPairingCode(options.pairingPhoneDigits);
            const formatted =
              rawCode.length === 8 ? `${rawCode.slice(0, 4)}-${rawCode.slice(4)}` : rawCode;
            currentPairingCode = formatted;
            currentPairingPhone = `+${options.pairingPhoneDigits}`;
            currentQrDataUrl = null;
            connectionStatus = "pairing_code_ready";
            sendWelcomeOnNextOpen = true;
            options.onReady?.();
          } catch (pairErr: any) {
            lastError = pairErr?.message || "Failed to generate pairing code";
            console.error("[WhatsApp Direct] Pairing code error:", lastError);
            options.onReady?.();
          }
        }
      } else {
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
          currentPairingCode = null;
          connectionStatus = "qr_ready";
          sendWelcomeOnNextOpen = true;
          options?.onReady?.();
        } catch (qrErr: any) {
          lastError = qrErr?.message || "Failed to generate QR image";
          options?.onReady?.();
        }
      }
    }

    if (connection === "open") {
      connectionStatus = "connected";
      reconnectAttempts = 0;
      currentQrDataUrl = null;
      currentPairingCode = null;
      lastError = null;

      const rawId: string = sock.user?.id || "";
      const phonePart = rawId.split(":")[0]?.split("@")[0]?.replace(/[^\d]/g, "");
      connectedPhone = phonePart ? `+${phonePart}` : null;
      console.log(
        `[WhatsApp Direct] Connected successfully as ${connectedPhone || DEFAULT_STORE_WA_PHONE}`
      );

      options?.onReady?.();

      const shouldWelcome = sendWelcomeOnNextOpen;
      sendWelcomeOnNextOpen = false;

      setTimeout(async () => {
        if (shouldWelcome) {
          const target = currentPairingPhone || connectedPhone || DEFAULT_STORE_WA_PHONE;
          await sendViaDirectWhatsApp(
            target,
            `✅ *تم تفعيل إشعارات الطلبات على واتساب المتجر بنجاح!*\n\nستصلك هنا تلقائياً جميع الطلبات الجديدة ورسائل العملاء فور إرسالها.`
          ).catch(() => {});
        }
        await flushPendingNotificationsNow().catch((err) =>
          console.error("[WhatsApp Direct] Queue flush error:", err)
        );
      }, 1500);
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      console.log(
        `[WhatsApp Direct] Connection closed (code=${statusCode}, manualReset=${isManualReset}, loggedOut=${loggedOut})`
      );

      if (isManualReset) {
        return;
      }

      if (loggedOut) {
        activeSock = null;
        connectionStatus = "disconnected";
        connectedPhone = null;
        currentQrDataUrl = null;
        currentPairingCode = null;
        clearSessionFiles();
      } else {
        const hasCreds = fs.existsSync(path.join(SESSION_DIR, "creds.json"));
        if (hasCreds) {
          connectionStatus = "connecting";
          reconnectAttempts++;
          const delayMs =
            statusCode === 515 || statusCode === DisconnectReason?.restartRequired
              ? 400
              : Math.min(1500 * Math.pow(1.5, Math.min(reconnectAttempts - 1, 5)), 15000);
          reconnectTimer = setTimeout(() => {
            createWhatsAppSocket().catch((err) => {
              console.error("[WhatsApp Direct] Reconnect error:", err);
              connectionStatus = "disconnected";
            });
          }, delayMs);
        } else {
          connectionStatus = "disconnected";
        }
      }
    }
  });
}

async function stopCurrentSocket() {
  isManualReset = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (activeSock) {
    try {
      activeSock.end(undefined);
    } catch {
      // ignore
    }
    activeSock = null;
  }
  isManualReset = false;
}

export function getDirectWhatsAppStatus() {
  return {
    status: connectionStatus,
    connected: connectionStatus === "connected",
    connectedPhone,
    qrDataUrl: connectionStatus === "qr_ready" ? currentQrDataUrl : null,
    pairingCode: connectionStatus === "pairing_code_ready" ? currentPairingCode : null,
    pairingPhone: currentPairingPhone,
    pendingOrdersCount: getPendingQueueCount(),
    lastError,
  };
}

export async function startDirectWhatsAppQr() {
  if (connectionStatus === "connected") {
    return getDirectWhatsAppStatus();
  }

  if (connectionStatus === "connecting" && hasSavedRegisteredSession()) {
    await new Promise((r) => setTimeout(r, 3000));
    if ((connectionStatus as WhatsAppDirectStatus) === "connected") {
      return getDirectWhatsAppStatus();
    }
  }

  await stopCurrentSocket();
  clearSessionFiles();
  currentQrDataUrl = null;
  currentPairingCode = null;

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => resolve(), 9000);
    createWhatsAppSocket({
      onReady: () => {
        clearTimeout(timeout);
        resolve();
      },
    }).catch((err) => {
      lastError = err?.message || String(err);
      clearTimeout(timeout);
      resolve();
    });
  });

  return getDirectWhatsAppStatus();
}

export async function startDirectWhatsAppPairingCode(rawPhone?: string) {
  if (connectionStatus === "connected") {
    return getDirectWhatsAppStatus();
  }

  if (connectionStatus === "connecting" && hasSavedRegisteredSession()) {
    await new Promise((r) => setTimeout(r, 3000));
    if ((connectionStatus as WhatsAppDirectStatus) === "connected") {
      return getDirectWhatsAppStatus();
    }
  }

  const digits = normalizePhoneDigits(rawPhone);
  await stopCurrentSocket();
  clearSessionFiles();
  currentQrDataUrl = null;
  currentPairingCode = null;

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => resolve(), 10000);
    createWhatsAppSocket({
      pairingPhoneDigits: digits,
      onReady: () => {
        clearTimeout(timeout);
        resolve();
      },
    }).catch((err) => {
      lastError = err?.message || String(err);
      clearTimeout(timeout);
      resolve();
    });
  });

  return getDirectWhatsAppStatus();
}

export async function disconnectDirectWhatsApp() {
  isManualReset = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (activeSock) {
    try {
      await activeSock.logout();
    } catch {
      try {
        activeSock.end(undefined);
      } catch {
        // ignore
      }
    }
    activeSock = null;
  }
  clearSessionFiles();
  connectionStatus = "disconnected";
  connectedPhone = null;
  currentQrDataUrl = null;
  currentPairingCode = null;
  lastError = null;
  isManualReset = false;
  return getDirectWhatsAppStatus();
}

export function autoRestoreDirectWhatsAppOnBoot() {
  if (hasSavedRegisteredSession()) {
    console.log("[WhatsApp Direct] Found existing registered session, restoring connection...");
    createWhatsAppSocket().catch((err) => {
      console.error("[WhatsApp Direct] Auto-restore failed:", err);
    });
  }
}
