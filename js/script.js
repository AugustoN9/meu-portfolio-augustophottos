// 1. MAPA DE CATEGORIAS -> ARQUIVOS JSON
// ATENÇÃO: Confira se os nomes dos arquivos na pasta data/ batem exatamente com estes caminhos
const FONTES_JSON = {
  formatura: { arquivo: "data/formatura.json", nomeExibicao: "Formatura" },
  natal: { arquivo: "data/natal.json", nomeExibicao: "Ensaio de Natal" },
  aniversario: {
    arquivo: "data/aniversario.json",
    nomeExibicao: "Aniversário Infantil",
  },
  pascoa: { arquivo: "data/pascoa.json", nomeExibicao: "Ensaio de Páscoa" },
};

const cacheCategorias = {};
let listaAtualExibicao = [];
let fotosExibidas = 0;
const LOTE_INICIAL = 12;

const containerGaleria = document.getElementById("mosaico-galeria");
const labelCategoria = document.getElementById("categoria-atual");
const modalElement = new bootstrap.Modal(document.getElementById("fotoModal"));

// 2. UTILITÁRIOS DE URL E RITMO DO MOSAICO
function gerarUrlPorId(id, largura = 800) {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${largura}`;
}

function obterFormatoMosaico(indice) {
  const padrao = indice % 6;
  if (padrao === 0) return "item-tall";
  if (padrao === 3) return "item-wide";
  return "";
}

// 3. BUSCA UM JSON ESPECÍFICO
async function buscarJsonCategoria(chave) {
  if (cacheCategorias[chave]) {
    return cacheCategorias[chave];
  }

  const config = FONTES_JSON[chave];
  if (!config) return [];

  try {
    const resposta = await fetch(config.arquivo);
    if (!resposta.ok) {
      console.warn(
        `Arquivo ${config.arquivo} retornou status ${resposta.status}`,
      );
      return [];
    }

    const dados = await resposta.json();
    const listaTratada = (Array.isArray(dados) ? dados : []).map((foto) => ({
      ...foto,
      categoriaKey: chave,
      categoriaNome: config.nomeExibicao,
    }));

    cacheCategorias[chave] = listaTratada;
    return listaTratada;
  } catch (erro) {
    console.warn(`Erro ao carregar ${config.arquivo}:`, erro);
    return [];
  }
}

// 4. MONTA O CARROSSEL DO TOPO COM FOTOS VARIADAS DE CADA CATEGORIA
function montarCarrosselHero(resultadosPorCategoria) {
  const carouselInner = document.getElementById("hero-carousel-inner");
  const carouselIndicators = document.getElementById(
    "hero-carousel-indicators",
  );

  // Pega até 3 fotos de cada categoria que tiver arquivos carregados
  const slidesSelecionados = [];
  resultadosPorCategoria.forEach((lista) => {
    if (lista.length > 0) {
      slidesSelecionados.push(...lista.slice(0, 3));
    }
  });

  if (slidesSelecionados.length === 0) return;

  // Embaralha levemente ou intercala para alternar os temas no carrossel
  const slidesIntercalados = [];
  for (let i = 0; i < 3; i++) {
    resultadosPorCategoria.forEach((lista) => {
      if (lista[i]) slidesIntercalados.push(lista[i]);
    });
  }

  carouselInner.innerHTML = "";
  carouselIndicators.innerHTML = "";

  slidesIntercalados.forEach((foto, idx) => {
    const ativo = idx === 0 ? "active" : "";
    const urlBanner = foto.id ? gerarUrlPorId(foto.id, 1920) : foto.url_imagem;

    // Cria indicador (bolinha)
    const btnIndicador = document.createElement("button");
    btnIndicador.type = "button";
    btnIndicador.dataset.bsTarget = "#heroCarousel";
    btnIndicador.dataset.bsSlideTo = idx;
    if (idx === 0) {
      btnIndicador.className = "active";
      btnIndicador.setAttribute("aria-current", "true");
    }
    btnIndicador.setAttribute("aria-label", `Slide ${idx + 1}`);
    carouselIndicators.appendChild(btnIndicador);

    // Cria slide
    const slideDiv = document.createElement("div");
    slideDiv.className = `carousel-item hero-slide ${ativo}`;
    slideDiv.style.backgroundImage = `url('${urlBanner}')`;
    slideDiv.innerHTML = `<div class="hero-overlay"></div>`;
    carouselInner.appendChild(slideDiv);
  });
}

// 5. MONTA A GALERIA MISTA (INTERCALA UM POUCO DE CADA CATEGORIA)
async function carregarGaleriaMista(inicializarCarrossel = false) {
  const chaves = Object.keys(FONTES_JSON);
  const resultados = await Promise.all(
    chaves.map((chave) => buscarJsonCategoria(chave)),
  );

  if (inicializarCarrossel) {
    montarCarrosselHero(resultados);
  }

  const mistura = [];
  const maiorTamanho = Math.max(...resultados.map((lista) => lista.length), 0);

  for (let i = 0; i < maiorTamanho; i++) {
    resultados.forEach((lista) => {
      if (lista[i]) {
        mistura.push(lista[i]);
      }
    });
  }

  return mistura;
}

// 6. CONTROLE DE EXIBIÇÃO POR FILTRO
async function selecionarCategoria(filtro = "todos", primeiraCarga = false) {
  containerGaleria.innerHTML = `
        <div class="text-center py-5 w-100" style="grid-column: 1 / -1;">
            <div class="spinner-border text-secondary" role="status"></div>
            <p class="text-muted mt-2 mb-0">Carregando fotografias...</p>
        </div>
    `;
  removerBotaoCarregarMais();

  if (filtro === "todos") {
    labelCategoria.textContent = "Mostrando: Destaques de todos os ensaios";
    listaAtualExibicao = await carregarGaleriaMista(primeiraCarga);
  } else {
    const nome = FONTES_JSON[filtro]?.nomeExibicao || filtro;
    labelCategoria.textContent = `Mostrando: ${nome}`;
    listaAtualExibicao = await buscarJsonCategoria(filtro);
  }

  renderizarLote(true);
}

// 7. RENDERIZAÇÃO EM LOTES NO MOSAICO
function renderizarLote(reiniciar = true) {
  if (reiniciar) {
    containerGaleria.innerHTML = "";
    fotosExibidas = 0;
    removerBotaoCarregarMais();
  }

  if (listaAtualExibicao.length === 0) {
    containerGaleria.innerHTML = `
            <p class="text-center text-muted py-4 w-100" style="grid-column: 1 / -1;">
                Novos ensaios desta categoria serão publicados em breve.
            </p>
        `;
    return;
  }

  const proximoLote = listaAtualExibicao.slice(
    fotosExibidas,
    fotosExibidas + LOTE_INICIAL,
  );

  proximoLote.forEach((foto, i) => {
    const indiceGlobal = fotosExibidas + i;
    const formato = foto.formato || obterFormatoMosaico(indiceGlobal);
    const titulo = foto.titulo || `${foto.categoriaNome} #${foto.index}`;
    const urlMiniatura = foto.id
      ? gerarUrlPorId(foto.id, 800)
      : foto.url_imagem;

    const div = document.createElement("div");
    div.className = `grid-item shadow-sm ${formato}`;
    div.innerHTML = `
            <img src="${urlMiniatura}" 
                 referrerpolicy="no-referrer" 
                 onerror="this.onerror=null;this.src='https://lh3.googleusercontent.com/d/${foto.id}=w800';" 
                 alt="${titulo}" 
                 loading="lazy">
        `;

    div.addEventListener("click", () => {
      const urlAlta = foto.id ? gerarUrlPorId(foto.id, 1800) : foto.url_imagem;
      const modalImg = document.getElementById("modal-img");
      modalImg.src = urlAlta;
      modalImg.onerror = () => {
        modalImg.onerror = null;
        modalImg.src = `https://lh3.googleusercontent.com/d/${foto.id}=w1800`;
      };
      document.getElementById("modal-legenda").textContent = titulo;
      modalElement.show();
    });

    containerGaleria.appendChild(div);
  });

  fotosExibidas += proximoLote.length;

  if (fotosExibidas < listaAtualExibicao.length) {
    criarBotaoCarregarMais(listaAtualExibicao.length - fotosExibidas);
  } else {
    removerBotaoCarregarMais();
  }
}

function criarBotaoCarregarMais(restantes) {
  removerBotaoCarregarMais();
  const wrapper = document.createElement("div");
  wrapper.id = "btn-carregar-mais-wrapper";
  wrapper.className = "text-center mt-4";
  wrapper.innerHTML = `
        <button id="btn-carregar-mais" class="btn btn-outline-dark px-4 py-2 fw-semibold">
            Carregar mais fotos (${restantes} restantes)
        </button>
    `;
  containerGaleria.insertAdjacentElement("afterend", wrapper);

  document.getElementById("btn-carregar-mais").addEventListener("click", () => {
    renderizarLote(false);
  });
}

function removerBotaoCarregarMais() {
  const existente = document.getElementById("btn-carregar-mais-wrapper");
  if (existente) existente.remove();
}

// 8. EVENTOS DE CLIQUE NOS FILTROS DA NAVBAR
document.querySelectorAll(".nav-link[data-filter]").forEach((link) => {
  link.addEventListener("click", (e) => {
    document
      .querySelectorAll(".nav-link")
      .forEach((nav) => nav.classList.remove("active"));
    e.target.classList.add("active");

    const filtro = e.target.getAttribute("data-filter");
    selecionarCategoria(filtro, false);

    const navbarCollapse = document.getElementById("navbarNav");
    if (navbarCollapse.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(navbarCollapse).hide();
    }
  });
});

// Inicializa exibindo a galeria mista e preenchendo o carrossel
document.addEventListener("DOMContentLoaded", () =>
  selecionarCategoria("todos", true),
);
