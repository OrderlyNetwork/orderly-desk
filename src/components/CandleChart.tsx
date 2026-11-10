import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "../lib/types";

interface CandleChartProps {
  data: Candle[];
  symbol: string;
  interval: string;
  loading?: boolean;
}

export default function CandleChart({ data, symbol, interval, loading }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const fitKeyRef = useRef("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: false,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#7d8592",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(230, 232, 234, 0.035)" },
        horzLines: { color: "rgba(230, 232, 234, 0.055)" },
      },
      rightPriceScale: {
        borderColor: "rgba(230, 232, 234, 0.08)",
        scaleMargins: { top: 0.12, bottom: 0.26 },
      },
      timeScale: {
        borderColor: "rgba(230, 232, 234, 0.08)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(156, 117, 255, 0.4)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#6e21c8",
        },
        horzLine: {
          color: "rgba(156, 117, 255, 0.4)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#6e21c8",
        },
      },
      handleScroll: true,
      handleScale: true,
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#2ee08a",
      downColor: "#ff5c6c",
      borderVisible: false,
      wickUpColor: "rgba(46, 224, 138, 0.8)",
      wickDownColor: "rgba(255, 92, 108, 0.8)",
      priceLineVisible: true,
      priceLineColor: "rgba(156, 117, 255, 0.45)",
      priceLineWidth: 1,
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volume.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candles;
    volumeRef.current = volume;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      chart.applyOptions({
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const candles = candleRef.current;
    const volume = volumeRef.current;
    const chart = chartRef.current;
    if (!candles || !volume || !chart) return;

    candles.setData(
      data.map((candle) => ({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    );
    volume.setData(
      data.map((candle) => ({
        time: candle.time as UTCTimestamp,
        value: candle.volume,
        color:
          candle.close >= candle.open
            ? "rgba(46, 224, 138, 0.22)"
            : "rgba(255, 92, 108, 0.22)",
      })),
    );

    if (data.length) {
      const fitKey = `${symbol}:${interval}`;
      if (fitKeyRef.current !== fitKey) {
        chart.timeScale().fitContent();
        fitKeyRef.current = fitKey;
      }
    }
  }, [data, symbol, interval]);

  return (
    <div className="relative h-[300px] w-full md:h-[380px]">
      <div ref={containerRef} className="absolute inset-0" />
      {loading && !data.length ? (
        <div className="absolute inset-0 grid place-items-center bg-panel/40 font-mono text-xs text-dim">
          loading candles…
        </div>
      ) : null}
    </div>
  );
}
