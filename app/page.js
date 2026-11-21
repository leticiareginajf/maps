"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./page.module.css";
import {
  formatarDistancia,
  haversine,
  tempoCaminhadaMinutos,
} from "../lib/geodesia";

const MapaInterativo = dynamic(() => import("../components/MapaNavegacao"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "#64748b",
        borderRadius: 14,
      }}
    >
      Carregando mapa...
    </div>
  ),
});

const PRECISAO_MAXIMA_METROS = 30;
const DESLOCAMENTO_MINIMO_METROS = 10;

export default function Home() {
  const [leitura, setLeitura] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(null);

  // PONTO A E PONTO B
  const [pontoA, setPontoA] = useState(null);
  const [pontoB, setPontoB] = useState(null);

  function capturarPontoGPS() {
    if (!navigator.geolocation) {
      setErro("Este navegador não possui suporte à Geolocation API.");
      return;
    }

    setBuscando(true);
    setErro(null);

    function callbackSucesso(posicao) {
      const coords = posicao.coords;
      const novoPonto = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        precisao: coords.accuracy,
        horario: new Date(posicao.timestamp).toLocaleTimeString("pt-BR"),
      };

      if (alvo === "A") {
        setPontoA(novoPonto);
        setAlvo("B"); // avança automaticamente a seleção para o Ponto B
      } else {
        setPontoB(novoPonto);
      }
      setBuscando(false);
    }

    function callbackErro(erroHardware) {
      setErro(
        `Falha ao ler o GPS (código ${erroHardware.code}): ${erroHardware.message}`,
      );
      setBuscando(false);
    }

    const opcoesConfig = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      callbackSucesso,
      callbackErro,
      opcoesConfig,
    );
  }

  function limparPontos() {
    setPontoA(null);
    setPontoB(null);
    setAlvo("A");
    setErro(null);
  }

  const [largura, setLargura] = useState(10);
  const [comprimento, setComprimento] = useState(25);

  const area = useMemo(() => {
    return largura * comprimento;
  }, [largura, comprimento]);

  function calcularDistancia() {
    // devolve null (se faltar algum ponto) ou o número em metros
    console.log("Calculando distância entre pontos A e B...");
  }

  const distancia = useMemo(() => {
    if (!pontoA || !pontoB) return null;

    return haversine(
      pontoA.latitude,
      pontoA.longitude,
      pontoB.latitude,
      pontoB.longitude,
    );
  }, [pontoA, pontoB]);

  // Tradução amigável dos erros do GPS
  function traduzirErroGPS(erroHardware) {
    switch (erroHardware.code) {
      case erroHardware.PERMISSION_DENIED:
        return "Permissão negada. Clique no cadeado na barra de endereços e permita o acesso à Localização.";
      case erroHardware.POSITION_UNAVAILABLE:
        return "Sinal de localização indisponível. Verifique se o dispositivo possui receptor GNSS/GPS ativo.";
      case erroHardware.TIMEOUT:
        return "Tempo limite esgotado sem sinal de satélite.";
      default:
        return `Erro de localização: ${erroHardware.message}`;
    }
  }

  // O coração do app: busca a coordenada via hardware
  function buscarPosicao() {
    // Passo 1: o navegador tem suporte à API de Geolocalização?
    if (!navigator.geolocation) {
      setErro("Este navegador não possui suporte à Geolocation API.");
      return;
    }

    // Feedback visual: o botão passa a mostrar "Buscando localização..."
    setBuscando(true);
    setErro(null);

    // 1º parâmetro: chamada pelo navegador quando o satélite responde
    function callbackSucesso(posicao) {
      const coords = posicao.coords;
      setLeitura({
        latitude: coords.latitude,
        longitude: coords.longitude,
        altitude: coords.altitude,
        precisao: coords.accuracy,
        horario: new Date(posicao.timestamp).toLocaleTimeString("pt-BR"),
      });
      setBuscando(false);
    }

    // 2º parâmetro: chamada se a permissão for negada ou o sinal falhar
    function callbackErro(erroHardware) {
      setErro(traduzirErroGPS(erroHardware));
      setBuscando(false);
    }

    // 3º parâmetro: as regras de engenharia para o hardware
    const opcoesConfig = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    // Passo 2: o pedido ao hardware
    navigator.geolocation.getCurrentPosition(
      callbackSucesso,
      callbackErro,
      opcoesConfig,
    );
  }

  // Monta a URL do OpenStreetMap com Bounding Box (~1 km²)
  function montarUrlMapa() {
    const pontos = [pontoA, pontoB].filter(Boolean);
    if (pontos.length === 0) return null;

    const lats = pontos.map((p) => p.latitude);
    const lons = pontos.map((p) => p.longitude);
    const minLat = Math.min(...lats) - 0.002;
    const maxLat = Math.max(...lats) + 0.002;
    const minLon = Math.min(...lons) - 0.002;
    const maxLon = Math.max(...lons) + 0.002;

    const pino = pontoB || pontoA;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${pino.latitude},${pino.longitude}`;
  }

  return (
    <main className={styles.container}>
      {/* 1. Cabeçalho Didático */}
      <header className={styles.cabecalho}>
        <span className={styles.tagDisciplina}>SIG-Web • Aula 04.1</span>
        <h1 className={styles.titulo}>Coletor Geodésico GPS</h1>
        <p className={styles.subtitulo}>
          Captura de coordenadas WGS 84 e renderização cartográfica via PWA
          (Prof. José Rui).
        </p>
      </header>

      {/* 2. Botão Principal */}
      <button
        type="button"
        onClick={buscarPosicao}
        disabled={buscando}
        className={styles.btnBuscar}
      >
        {buscando ? "Buscando localização..." : "🎯 Buscar Coordenadas GPS"}
      </button>

      {/* Mensagem de Erro */}
      {erro && <div className={styles.erro}>⚠️ {erro}</div>}

      {/* 3. Cartão com os Dados Geográficos */}
      {leitura && (
        <section className={styles.cartao}>
          <div className={styles.cartaoTopo}>
            <span className={styles.cartaoTitulo}>
              Fix de Satélite (WGS 84)
            </span>
            <span className={styles.badgePrecisao}>
              Precisão: ±{leitura.precisao.toFixed(1)} m
            </span>
          </div>

          <div className={styles.gridCoordenadas}>
            <div className={styles.itemDado}>
              <span className={styles.labelDado}>Latitude</span>
              <span className={styles.valorDado}>
                {leitura.latitude.toFixed(6)}°
              </span>
            </div>

            <div className={styles.itemDado}>
              <span className={styles.labelDado}>Longitude</span>
              <span className={styles.valorDado}>
                {leitura.longitude.toFixed(6)}°
              </span>
            </div>

            <div className={styles.itemDado}>
              <span className={styles.labelDado}>Altitude</span>
              <span className={styles.valorDado}>
                {leitura.altitude !== null
                  ? `${leitura.altitude.toFixed(1)} m`
                  : "N/D"}
              </span>
            </div>

            <div className={styles.itemDado}>
              <span className={styles.labelDado}>Horário</span>
              <span className={styles.valorDado}>{leitura.horario}</span>
            </div>
          </div>
        </section>
      )}

      {/* 4. Mapa Incorporado com OpenStreetMap */}
      {leitura && (
        <section className={styles.mapaContainer}>
          <div className={styles.mapaCabecalho}>
            <span>Visualização Cartográfica (OpenStreetMap)</span>
            <span>Escala ~1 km²</span>
          </div>
          <iframe
            src={montarUrlMapa(leitura.latitude, leitura.longitude)}
            title="Posição GPS no OpenStreetMap"
            className={styles.mapaIframe}
            loading="lazy"
          />
        </section>
      )}

      {distancia !== null && (
        <section className={styles.cartaoDistancia}>
          <span className={styles.distanciaTitulo}>
            Distância Geodésica (Haversine)
          </span>
          <span className={styles.distanciaValor}>
            {formatarDistancia(distancia)}
          </span>
          <span className={styles.distanciaSub}>
            {distancia.toFixed(2)} metros entre o Ponto A e o Ponto B
          </span>
          <span className={styles.distanciaSub}>
            Caminhada a 5 km/h: {tempoCaminhadaMinutos(distancia).toFixed(1)}{" "}
            minutos
          </span>
        </section>
      )}

      {/* 5. Rodapé */}
      <footer className={styles.rodape}>
        Disciplina de SIG-Web • PWA funcional em JavaScript puro.
      </footer>
    </main>
  );
}
