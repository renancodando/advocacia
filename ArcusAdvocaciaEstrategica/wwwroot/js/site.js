(() => {
  "use strict";

  const raiz = document.documentElement;
  const corpo = document.body;
  const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ponteiroFino = window.matchMedia("(pointer: fine)");
  const estadoPonteiro = { alvoX: innerWidth / 2, alvoY: innerHeight / 2, x: innerWidth / 2, y: innerHeight / 2 };
  const elementosProfundos = [...document.querySelectorAll("[data-profundidade]")];
  let quadroRolagemPendente = false;
  let largura = innerWidth;
  let altura = innerHeight;
  let ultimoProgressoOrdem = -1;
  const elementosOrdem = [];

  function limitar(valor, minimo = 0, maximo = 1) {
    return Math.min(maximo, Math.max(minimo, valor));
  }

  function normalizar(valor, inicio, fim) {
    return limitar((valor - inicio) / (fim - inicio));
  }

  function interpolar(inicio, fim, progresso) {
    return inicio + (fim - inicio) * progresso;
  }

  function iniciarExperiencia() {
    requestAnimationFrame(() => corpo.classList.add("carregado"));
    document.getElementById("ano-atual").textContent = new Date().getFullYear();
    atualizarRolagem();
    window.__arcusPronto = true;
  }

  function atualizarPonteiro(evento) {
    estadoPonteiro.alvoX = evento.clientX;
    estadoPonteiro.alvoY = evento.clientY;
  }

  function controlarProfundidade() {
    const nx = (estadoPonteiro.x / largura - .5) * 2;
    const ny = (estadoPonteiro.y / altura - .5) * 2;
    raiz.style.setProperty("--mx", nx.toFixed(4));
    raiz.style.setProperty("--my", ny.toFixed(4));

    elementosProfundos.forEach((elemento) => {
      const profundidade = Number(elemento.dataset.profundidade || 0);
      elemento.style.translate = `${(nx * profundidade * .42).toFixed(2)}px ${(ny * profundidade * .34).toFixed(2)}px`;
    });
  }

  function animarAmbiente() {
    const suavidade = reduzMovimento.matches ? 1 : .105;
    estadoPonteiro.x += (estadoPonteiro.alvoX - estadoPonteiro.x) * suavidade;
    estadoPonteiro.y += (estadoPonteiro.alvoY - estadoPonteiro.y) * suavidade;
    controlarProfundidade();
    posicionarCursor();
    requestAnimationFrame(animarAmbiente);
  }

  const cursor = document.querySelector(".cursor");
  const legendaCursor = document.querySelector(".cursor-legenda");

  function posicionarCursor() {
    if (!cursor || !ponteiroFino.matches) return;
    cursor.style.transform = `translate3d(${estadoPonteiro.x - cursor.offsetWidth / 2}px, ${estadoPonteiro.y - cursor.offsetHeight / 2}px, 0)`;
  }

  function configurarCursor() {
    if (!cursor || !ponteiroFino.matches) return;
    document.querySelectorAll("a, button, input, select, textarea, [tabindex='0']").forEach((elemento) => {
      elemento.addEventListener("pointerenter", () => {
        cursor.classList.add("aberto");
        legendaCursor.textContent = elemento.dataset.cursor || (elemento.matches("input, select, textarea") ? "EDITAR" : "ABRIR");
      });
      elemento.addEventListener("pointerleave", () => {
        cursor.classList.remove("aberto");
        legendaCursor.textContent = "";
      });
    });
    document.addEventListener("pointerleave", () => { cursor.style.opacity = "0"; });
    document.addEventListener("pointerenter", () => { cursor.style.opacity = "1"; });
  }

  function atualizarRolagem() {
    const documento = document.documentElement;
    const limite = Math.max(1, documento.scrollHeight - altura);
    const progresso = limitar(scrollY / limite);
    raiz.style.setProperty("--rolagem", progresso.toFixed(4));

    const hero = document.querySelector(".hero");
    const progressoHero = limitar(scrollY / Math.max(hero.offsetHeight * .82, 1));
    raiz.style.setProperty("--progresso-hero", progressoHero.toFixed(4));
    document.querySelector(".cabecalho").classList.toggle("compacto", scrollY > 80);

    atualizarManifesto();
    atualizarMetodo();
    atualizarCampoDeOrdem();
    atualizarNavegacao();
    quadroRolagemPendente = false;
  }

  function atualizarNavegacao() {
    const links = [...document.querySelectorAll(".menu [data-secao-alvo]")];
    const linksVerticais = [...document.querySelectorAll(".hero-navegacao a")];
    if (scrollY < altura * .55) {
      links.forEach((link) => link.classList.remove("ativo"));
      linksVerticais.forEach((link, indice) => link.classList.toggle("ativo", indice === 0));
      document.querySelector(".progresso-atual").textContent = "01";
      return;
    }

    let selecionado = null;
    let menorDistancia = Number.POSITIVE_INFINITY;
    links.forEach((link) => {
      const secao = document.getElementById(link.dataset.secaoAlvo);
      const distancia = Math.abs(secao.getBoundingClientRect().top - altura * .3);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        selecionado = link;
      }
    });
    const caixaResultados = document.getElementById("resultados").getBoundingClientRect();
    if (caixaResultados.top < altura * .55 && caixaResultados.bottom > altura * .25) {
      selecionado = links.find((link) => link.dataset.secaoAlvo === "perspectiva");
    }
    links.forEach((link) => link.classList.toggle("ativo", link === selecionado));
    linksVerticais.forEach((link) => {
      const destino = selecionado ? `#${selecionado.dataset.secaoAlvo}` : "";
      link.classList.toggle("ativo", link.getAttribute("href") === destino);
    });
    if (selecionado) {
      document.querySelector(".progresso-atual").textContent = selecionado.querySelector("span").textContent;
    }
  }

  function atualizarManifesto() {
    const secao = document.querySelector(".manifesto");
    const inicio = secao.offsetTop;
    const percurso = Math.max(1, secao.offsetHeight - altura);
    const progresso = normalizar(scrollY, inicio, inicio + percurso);
    raiz.style.setProperty("--manifesto", progresso.toFixed(4));
    raiz.style.setProperty("--manifesto-clareza", `${((progresso - .45) * -20).toFixed(2)}vw`);
    raiz.style.setProperty("--manifesto-antes", `${((.45 - progresso) * 15).toFixed(2)}vh`);
    raiz.style.setProperty("--manifesto-complexidade", `${((1 - progresso) * 27).toFixed(2)}vh`);
    raiz.style.setProperty("--manifesto-parede-x", `${((1 - progresso) * 25).toFixed(2)}vw`);
  }

  function atualizarMetodo() {
    const secao = document.querySelector(".metodo");
    const caixa = secao.getBoundingClientRect();
    const progresso = limitar((altura * .78 - caixa.top) / Math.max(secao.offsetHeight * .72, 1));
    raiz.style.setProperty("--metodo", progresso.toFixed(4));
    document.querySelectorAll(".etapa").forEach((etapa, indice) => {
      etapa.classList.toggle("ativa", progresso >= indice / 4 + .08);
    });
  }

  function solicitarAtualizacaoRolagem() {
    if (quadroRolagemPendente) return;
    quadroRolagemPendente = true;
    requestAnimationFrame(atualizarRolagem);
  }

  function observarSecoes() {
    const observadorEntrada = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) entrada.target.classList.add("visivel");
      });
    }, { threshold: .22 });
    document.querySelectorAll(".resultados, .metodo, .escritorio, .contato").forEach((secao) => observadorEntrada.observe(secao));
  }

  function criarCampoDeOrdem() {
    const campo = document.querySelector(".campo-cena");
    if (!campo) return;
    let semente = 48271;
    const aleatorio = () => {
      semente = (semente * 16807) % 2147483647;
      return (semente - 1) / 2147483646;
    };
    const fragmento = document.createDocumentFragment();
    const registrar = (elemento, configuracao) => {
      fragmento.appendChild(elemento);
      elementosOrdem.push({ elemento, ...configuracao });
    };

    for (let i = 0; i < 52; i += 1) {
      const linha = document.createElement("i");
      linha.className = "linha-caos";
      const horizontal = i < 24;
      const vertical = i >= 24 && i < 42;
      const diagonal = !horizontal && !vertical;
      const larguraFinal = horizontal ? 68 : vertical ? 56 : 74;
      const finalX = horizontal ? 0 : vertical ? (i - 32.5) * .052 : (i % 2 ? -.08 : .08);
      const finalY = horizontal ? (i - 11.5) * .04 : vertical ? 0 : (i - 46.5) * .055;
      const finalRotacao = horizontal ? 0 : vertical ? 90 : i % 2 ? 38 : -38;
      linha.style.setProperty("--largura", `${larguraFinal}%`);
      linha.style.setProperty("--opacidade", (.18 + aleatorio() * .55).toFixed(2));
      linha.style.setProperty("--ordem", i);
      linha.classList.toggle("linha-diagonal", diagonal);
      registrar(linha, {
        tipo: "linha",
        inicioX: -.48 + aleatorio() * .96,
        inicioY: -.46 + aleatorio() * .92,
        fimX: finalX,
        fimY: finalY,
        inicioRotacao: -190 + aleatorio() * 380,
        fimRotacao: finalRotacao,
        inicioZ: -210 + aleatorio() * 420,
        curvaX: -.2 + aleatorio() * .4,
        curvaY: -.18 + aleatorio() * .36,
        torcao: -95 + aleatorio() * 190,
        explosao: 45 + aleatorio() * 135,
        inicioEscala: .42 + aleatorio() * .86,
        inicioOpacidade: .12 + aleatorio() * .5,
        fimOpacidade: diagonal ? .38 : .52
      });
    }

    for (let i = 0; i < 9; i += 1) {
      const trajetoria = document.createElement("i");
      trajetoria.className = "trajetoria-caos";
      trajetoria.style.setProperty("--diametro", `${22 + i * 6.5}%`);
      trajetoria.style.setProperty("--recorte", `${8 + i * 19}deg`);
      registrar(trajetoria, {
        tipo: "trajetoria",
        inicioX: -.42 + aleatorio() * .84,
        inicioY: -.42 + aleatorio() * .84,
        fimX: 0,
        fimY: 0,
        inicioRotacao: -160 + aleatorio() * 320,
        fimRotacao: i % 2 ? 18 + i * 7 : -24 - i * 6,
        inicioZ: -160 + aleatorio() * 320,
        curvaX: -.1 + aleatorio() * .2,
        curvaY: -.1 + aleatorio() * .2,
        torcao: i % 2 ? 84 : -84,
        explosao: 80 + i * 8,
        inicioEscala: .55 + aleatorio() * .65,
        inicioOpacidade: .12 + aleatorio() * .3,
        fimOpacidade: .46
      });
    }

    const posicoesPlanos = [[-.31,-.29],[.31,-.29],[-.34,.28],[.34,.28],[-.22,0],[.22,0],[0,-.34],[0,.34]];
    posicoesPlanos.forEach(([fimX, fimY], i) => {
      const plano = document.createElement("i");
      plano.className = "plano-caos";
      plano.style.setProperty("--plano-largura", `${12 + aleatorio() * 10}%`);
      plano.style.setProperty("--plano-altura", `${17 + aleatorio() * 20}%`);
      registrar(plano, {
        tipo: "plano",
        inicioX: -.46 + aleatorio() * .92,
        inicioY: -.45 + aleatorio() * .9,
        fimX,
        fimY,
        inicioRotacao: -150 + aleatorio() * 300,
        fimRotacao: i % 2 ? -14 : 14,
        inicioZ: -240 + aleatorio() * 480,
        curvaX: -.16 + aleatorio() * .32,
        curvaY: -.14 + aleatorio() * .28,
        torcao: i % 2 ? 110 : -110,
        explosao: 130 + aleatorio() * 120,
        inicioEscala: .5 + aleatorio() * .8,
        inicioOpacidade: .1 + aleatorio() * .25,
        fimOpacidade: .36
      });
    });

    for (let i = 0; i < 18; i += 1) {
      const no = document.createElement("i");
      no.className = "no-caos";
      const angulo = i / 18 * Math.PI * 2;
      const raio = .19 + i % 3 * .075;
      registrar(no, {
        tipo: "no",
        inicioX: -.48 + aleatorio() * .96,
        inicioY: -.46 + aleatorio() * .92,
        fimX: Math.cos(angulo) * raio,
        fimY: Math.sin(angulo) * raio,
        inicioRotacao: aleatorio() * 180,
        fimRotacao: 45,
        inicioZ: -110 + aleatorio() * 320,
        curvaX: -.12 + aleatorio() * .24,
        curvaY: -.12 + aleatorio() * .24,
        torcao: 90,
        explosao: 90 + aleatorio() * 100,
        inicioEscala: .35 + aleatorio() * 1.2,
        inicioOpacidade: .3 + aleatorio() * .55,
        fimOpacidade: .9
      });
    }

    campo.appendChild(fragmento);
  }

  function atualizarCampoDeOrdem() {
    const secao = document.querySelector(".resultados");
    const campo = document.querySelector(".campo-ordem");
    if (!secao || !campo || !elementosOrdem.length) return;
    const caixaSecao = secao.getBoundingClientRect();
    const caixaCampo = campo.getBoundingClientRect();
    const inicio = altura * .78;
    const fim = -Math.max(secao.offsetHeight - altura * .82, altura * .32);
    const bruto = reduzMovimento.matches ? 1 : limitar((inicio - caixaSecao.top) / Math.max(inicio - fim, 1));
    const progresso = bruto * bruto * (3 - 2 * bruto);
    if (Math.abs(progresso - ultimoProgressoOrdem) < .0005) return;
    ultimoProgressoOrdem = progresso;
    const passagem = Math.sin(progresso * Math.PI);

    raiz.style.setProperty("--ordem-progresso", progresso.toFixed(4));
    elementosOrdem.forEach((item, indice) => {
      const alternancia = indice % 2 ? 1 : -1;
      const x = (interpolar(item.inicioX, item.fimX, progresso) + item.curvaX * passagem) * caixaCampo.width;
      const y = (interpolar(item.inicioY, item.fimY, progresso) + item.curvaY * passagem) * caixaCampo.height;
      const z = interpolar(item.inicioZ, item.tipo === "plano" ? -18 : 0, progresso) + passagem * item.explosao * alternancia;
      const rotacao = interpolar(item.inicioRotacao, item.fimRotacao, progresso) + passagem * item.torcao;
      const escala = interpolar(item.inicioEscala, 1, progresso) * (1 + passagem * (item.tipo === "no" ? .32 : .08));
      const opacidade = interpolar(item.inicioOpacidade, item.fimOpacidade, progresso);
      item.elemento.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), ${z.toFixed(1)}px) rotate(${rotacao.toFixed(1)}deg) scale(${escala.toFixed(3)})`;
      item.elemento.style.opacity = opacidade.toFixed(3);
    });

    const valorOrdem = (progresso * 100).toFixed(2);
    const valorCaos = ((1 - progresso) * 100).toFixed(2);
    const indice = document.querySelector(".resultado-progresso strong");
    document.querySelector("[data-indice-caos]").textContent = valorCaos;
    document.querySelector("[data-indice-ordem]").textContent = valorOrdem;
    indice.textContent = String(Math.round(progresso * 100)).padStart(3, "0");
  }

  function criarParticulas() {
    const canvas = document.getElementById("particulas");
    const contexto = canvas.getContext("2d", { alpha: true });
    let pontos = [];
    let quadro;

    function dimensionar() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const caixa = canvas.getBoundingClientRect();
      canvas.width = Math.round(caixa.width * dpr);
      canvas.height = Math.round(caixa.height * dpr);
      contexto.setTransform(dpr, 0, 0, dpr, 0, 0);
      const quantidade = largura < 620 ? 22 : largura < 1000 ? 45 : 72;
      pontos = Array.from({ length: quantidade }, (_, indice) => ({
        x: (indice * 73.7 % 100) / 100 * caixa.width,
        y: (indice * 41.3 % 100) / 100 * caixa.height,
        raio: indice % 9 === 0 ? 1.25 : .55,
        fase: indice * .74,
        velocidade: .0009 + (indice % 5) * .00017
      }));
    }

    function desenhar(tempo = 0) {
      const caixa = canvas.getBoundingClientRect();
      contexto.clearRect(0, 0, caixa.width, caixa.height);
      pontos.forEach((ponto, indice) => {
        const oscilacao = reduzMovimento.matches ? 0 : Math.sin(tempo * ponto.velocidade + ponto.fase) * 8;
        const x = ponto.x + oscilacao;
        const y = ponto.y + Math.cos(tempo * ponto.velocidade * .7 + ponto.fase) * 5;
        contexto.beginPath();
        contexto.fillStyle = indice % 6 === 0 ? "rgba(229,201,121,.78)" : "rgba(205,167,90,.35)";
        contexto.arc(x, y, ponto.raio, 0, Math.PI * 2);
        contexto.fill();
        if (indice % 8 === 0) {
          contexto.beginPath();
          contexto.strokeStyle = "rgba(205,167,90,.07)";
          contexto.moveTo(x, y);
          contexto.lineTo(x + 38 + (indice % 3) * 23, y);
          contexto.stroke();
        }
      });
      if (!reduzMovimento.matches) quadro = requestAnimationFrame(desenhar);
    }

    dimensionar();
    desenhar();
    return () => {
      cancelAnimationFrame(quadro);
      dimensionar();
      desenhar();
    };
  }

  function configurarMenu() {
    const botao = document.querySelector(".menu-botao");
    const menu = document.querySelector(".menu");

    function alternarMenu(forcarFechado = false) {
      const aberto = forcarFechado ? false : !corpo.classList.contains("menu-aberto");
      corpo.classList.toggle("menu-aberto", aberto);
      botao.setAttribute("aria-expanded", String(aberto));
      if (aberto) menu.querySelector("a").focus();
    }

    botao.addEventListener("click", () => alternarMenu());
    menu.addEventListener("click", (evento) => {
      if (evento.target.closest("a")) alternarMenu(true);
    });
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && corpo.classList.contains("menu-aberto")) {
        alternarMenu(true);
        botao.focus();
      }
    });
  }

  function configurarCampos() {
    const formulario = document.getElementById("formulario-contato");
    const campos = [...formulario.querySelectorAll("input, select, textarea")];
    const retorno = formulario.querySelector(".retorno-formulario");
    const mensagens = {
      nome: "Informe seu nome.",
      email: "Informe um e-mail válido.",
      telefone: "Informe um telefone para retorno.",
      assunto: "Escolha o assunto principal.",
      mensagem: "Conte o contexto em pelo menos 20 caracteres."
    };

    function atualizarEstado(campo) {
      const envoltorio = campo.closest(".campo");
      envoltorio.classList.toggle("preenchido", campo.value.trim().length > 0);
    }

    function validarCampo(campo) {
      const envoltorio = campo.closest(".campo");
      const erro = envoltorio.querySelector(".erro-campo");
      let valido = campo.checkValidity();
      if (campo.id === "telefone" && campo.value.replace(/\D/g, "").length < 10) valido = false;
      envoltorio.classList.toggle("invalido", !valido);
      campo.setAttribute("aria-invalid", String(!valido));
      erro.textContent = valido ? "" : mensagens[campo.id];
      return valido;
    }

    campos.forEach((campo) => {
      campo.addEventListener("input", () => {
        atualizarEstado(campo);
        if (campo.getAttribute("aria-invalid") === "true") validarCampo(campo);
      });
      campo.addEventListener("change", () => atualizarEstado(campo));
      campo.addEventListener("blur", () => { if (campo.value) validarCampo(campo); });
    });

    const telefone = document.getElementById("telefone");
    telefone.addEventListener("input", () => {
      const digitos = telefone.value.replace(/\D/g, "").slice(0, 11);
      telefone.value = digitos.length > 10
        ? digitos.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
        : digitos.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    });

    formulario.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const validos = campos.map(validarCampo);
      const primeiroInvalido = campos[validos.indexOf(false)];
      if (primeiroInvalido) {
        primeiroInvalido.focus();
        retorno.textContent = "Revise os campos indicados para continuar.";
        return;
      }
      const dados = new FormData(formulario);
      const assunto = encodeURIComponent(`[Site ARCUS] ${dados.get("assunto")}`);
      const corpoEmail = encodeURIComponent(`Nome: ${dados.get("nome")}\nTelefone: ${dados.get("telefone")}\n\n${dados.get("mensagem")}`);
      retorno.textContent = "Dados validados. Abrindo seu aplicativo de e-mail com a mensagem preparada…";
      setTimeout(() => { window.location.href = `mailto:contato@arcusadvocacia.com.br?subject=${assunto}&body=${corpoEmail}`; }, 450);
    });
  }

  function configurarMagnetismo() {
    if (!ponteiroFino.matches || reduzMovimento.matches) return;
    document.querySelectorAll(".botao-linhas").forEach((botao) => {
      botao.addEventListener("pointermove", (evento) => {
        const caixa = botao.getBoundingClientRect();
        const x = evento.clientX - caixa.left - caixa.width / 2;
        const y = evento.clientY - caixa.top - caixa.height / 2;
        botao.style.translate = `${(x * .08).toFixed(1)}px ${(y * .13).toFixed(1)}px`;
      });
      botao.addEventListener("pointerleave", () => { botao.style.translate = "0 0"; });
    });
  }

  window.addEventListener("pointermove", atualizarPonteiro, { passive: true });
  window.addEventListener("scroll", solicitarAtualizacaoRolagem, { passive: true });

  const redimensionarParticulas = criarParticulas();
  let temporizadorRedimensionamento;
  window.addEventListener("resize", () => {
    clearTimeout(temporizadorRedimensionamento);
    temporizadorRedimensionamento = setTimeout(() => {
      largura = innerWidth;
      altura = innerHeight;
      ultimoProgressoOrdem = -1;
      redimensionarParticulas();
      atualizarRolagem();
    }, 160);
  }, { passive: true });

  criarCampoDeOrdem();
  configurarCursor();
  configurarMenu();
  configurarCampos();
  configurarMagnetismo();
  observarSecoes();
  iniciarExperiencia();
  animarAmbiente();
})();
