// 1. BANCO DE DADOS DAS FOTOS (Cole aqui os links compartilhados do Google Drive)
const fotosPortfolio = [
  {
    urlDrive: "https://drive.google.com/file/d/SEU_ID_AQUI_1/view?usp=sharing",
    categoria: "formatura",
    titulo: "Formatura Direito - Parque Farroupilha",
    formato: "item-tall", // Vertical (ocupa 2 linhas)
  },
  {
    urlDrive: "https://drive.google.com/file/d/SEU_ID_AQUI_2/view?usp=sharing",
    categoria: "aniversario",
    titulo: "1º Aninho da Alice",
    formato: "", // Quadrado padrão (1x1)
  },
  {
    urlDrive: "https://drive.google.com/file/d/SEU_ID_AQUI_3/view?usp=sharing",
    categoria: "natal",
    titulo: "Mini Ensaio de Natal em Família",
    formato: "", // Quadrado padrão (1x1)
  },
  {
    urlDrive: "https://drive.google.com/file/d/SEU_ID_AQUI_4/view?usp=sharing",
    categoria: "pascoa",
    titulo: "Ensaio Temático de Páscoa",
    formato: "item-wide", // Horizontal largo (ocupa 2 colunas)
  },
  {
    urlDrive: "https://drive.google.com/file/d/SEU_ID_AQUI_5/view?usp=sharing",
    categoria: "aniversario",
    titulo: "Festa Infantil - Luz Natural",
    formato: "item-wide",
  },
];

// 2. FUNÇÃO QUE EXTRAI O ID DO GOOGLE DRIVE E GERA A URL DIRETA
function converterLinkDrive(linkOriginal, largura = 1200) {
  // Expressão regular para capturar o ID entre /d/ e /view (ou ?id=)
  const regex = /\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/;
  const match = linkOriginal.match(regex);

  if (match) {
    const fileId = match[1] || match[2];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${largura}`;
  }
  return linkOriginal; // Caso já seja uma URL direta
}

// 3. RENDERIZAÇÃO DA GALERIA
const containerGaleria = document.getElementById("mosaico-galeria");
const labelCategoria = document.getElementById("categoria-atual");
const modalElement = new bootstrap.Modal(document.getElementById("fotoModal"));

function renderizarGaleria(filtro = "todos") {
  containerGaleria.innerHTML = "";

  const fotosFiltradas =
    filtro === "todos"
      ? fotosPortfolio
      : fotosPortfolio.filter((foto) => foto.categoria === filtro);

  if (fotosFiltradas.length === 0) {
    containerGaleria.innerHTML = `<p class="text-center text-muted col-span-3 w-100">Nenhuma foto cadastrada nesta categoria ainda.</p>`;
    return;
  }

  fotosFiltradas.forEach((foto) => {
    const urlImagem = converterLinkDrive(foto.urlDrive, 1000);

    const div = document.createElement("div");
    div.className = `grid-item shadow-sm ${foto.formato}`;
    div.innerHTML = `<img src="${urlImagem}" alt="${foto.titulo}" loading="lazy">`;

    // Abre modal em alta resolução ao clicar
    div.addEventListener("click", () => {
      document.getElementById("modal-img").src = converterLinkDrive(
        foto.urlDrive,
        1800,
      );
      document.getElementById("modal-legenda").textContent = foto.titulo;
      modalElement.show();
    });

    containerGaleria.appendChild(div);
  });
}

// 4. EVENTOS DE FILTRO NA NAVBAR
document.querySelectorAll(".nav-link[data-filter]").forEach((link) => {
  link.addEventListener("click", (e) => {
    // Atualiza classe ativa no menu
    document
      .querySelectorAll(".nav-link")
      .forEach((nav) => nav.classList.remove("active"));
    e.target.classList.add("active");

    const categoria = e.target.getAttribute("data-filter");
    labelCategoria.textContent = `Mostrando: ${categoria === "todos" ? "Todos os ensaios" : categoria}`;
    renderizarGaleria(categoria);
  });
});

// Inicializa com todas as fotos e configura a capa (Hero)
document.addEventListener("DOMContentLoaded", () => {
  renderizarGaleria("todos");

  // Opcional: Puxar a capa também do Google Drive
  const linkCapaDrive =
    "https://drive.google.com/file/d/SEU_ID_DA_CAPA/view?usp=sharing";
  if (!linkCapaDrive.includes("SEU_ID")) {
    document.querySelector(".hero-section").style.backgroundImage =
      `url('${converterLinkDrive(linkCapaDrive, 1920)}')`;
  }
});
