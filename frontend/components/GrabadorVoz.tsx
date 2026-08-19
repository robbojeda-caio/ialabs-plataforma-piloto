"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Grabación de la narración del proceso directamente en el navegador.
 *
 * Graba en Opus a 24 kbps: voz perfectamente inteligible en ~10 MB por hora,
 * muy por debajo del límite de 24 MB de la transcripción. Ver doc 08 §3.
 */

const LIMITE_SEGUNDOS = 15 * 60; // 15 min: más allá, la narración se dispersa y el descubrimiento empeora
const AVISO_SEGUNDOS = 13 * 60;

const GUION = [
  "¿Cómo empieza este proceso? ¿Qué lo dispara?",
  "¿Quién hace qué, y en qué orden?",
  "¿Qué decisiones o excepciones aparecen?",
  "¿Qué sistemas, plantillas o archivos usas?",
  "¿Cuándo lo das por terminado?",
];

type Props = {
  onGrabacionLista: (audio: Blob, segundos: number) => void;
  deshabilitado?: boolean;
};

export default function GrabadorVoz({ onGrabacionLista, deshabilitado }: Props) {
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [nivel, setNivel] = useState(0);

  const grabadorRef = useRef<MediaRecorder | null>(null);
  const trozosRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const detener = useCallback(() => {
    grabadorRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (animRef.current) cancelAnimationFrame(animRef.current);
    audioCtxRef.current?.close().catch(() => {});
    setGrabando(false);
  }, []);

  // Corte automático al llegar al límite: evita audios que la transcripción rechazaría
  useEffect(() => {
    if (!grabando) return;
    const t = setInterval(() => {
      setSegundos((s) => {
        if (s + 1 >= LIMITE_SEGUNDOS) detener();
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [grabando, detener]);

  async function iniciar() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      // Medidor de nivel: confirma visualmente que el micrófono está captando
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const fuente = ctx.createMediaStreamSource(stream);
      const analizador = ctx.createAnalyser();
      analizador.fftSize = 256;
      fuente.connect(analizador);
      const datos = new Uint8Array(analizador.frequencyBinCount);
      const medir = () => {
        analizador.getByteFrequencyData(datos);
        const prom = datos.reduce((a, b) => a + b, 0) / datos.length;
        setNivel(Math.min(1, prom / 90));
        animRef.current = requestAnimationFrame(medir);
      };
      medir();

      const tipo = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const grabador = new MediaRecorder(stream, {
        mimeType: tipo,
        audioBitsPerSecond: 24000,
      });
      trozosRef.current = [];
      grabador.ondataavailable = (e) => {
        if (e.data.size > 0) trozosRef.current.push(e.data);
      };
      grabador.onstop = () => {
        const audio = new Blob(trozosRef.current, { type: tipo });
        onGrabacionLista(audio, segundos);
      };
      grabador.start(1000);
      grabadorRef.current = grabador;
      setSegundos(0);
      setGrabando(true);
    } catch {
      setError(
        "No pudimos acceder al micrófono. Revisa los permisos del navegador e inténtalo de nuevo."
      );
    }
  }

  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  const cerca = segundos >= AVISO_SEGUNDOS;

  return (
    <div className="grabador">
      {!grabando ? (
        <>
          <button className="btn-grabar" onClick={iniciar} disabled={deshabilitado}>
            <span className="punto-rojo" aria-hidden="true" />
            Grabar mi proceso
          </button>
          <div className="guion">
            <p className="guion-titulo">Mientras grabas, cuéntanos:</p>
            <ol>
              {GUION.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          </div>
        </>
      ) : (
        <div className="grabando">
          <div className="medidor" aria-hidden="true">
            <span style={{ transform: `scaleY(${0.25 + nivel * 0.75})` }} />
            <span style={{ transform: `scaleY(${0.35 + nivel * 0.65})` }} />
            <span style={{ transform: `scaleY(${0.2 + nivel})` }} />
            <span style={{ transform: `scaleY(${0.4 + nivel * 0.6})` }} />
            <span style={{ transform: `scaleY(${0.3 + nivel * 0.7})` }} />
          </div>
          <div className="tiempo" aria-live="off">
            {mm}:{ss}
          </div>
          <button className="btn-detener" onClick={detener}>
            Detener y procesar
          </button>
          {cerca && (
            <p className="aviso-limite">
              Se detendrá automáticamente a los 15 minutos. Si el proceso es más
              largo, conviene grabarlo en varias sesiones cortas.
            </p>
          )}
          <ol className="guion-vivo">
            {GUION.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
