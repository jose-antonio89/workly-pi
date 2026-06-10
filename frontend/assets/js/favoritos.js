/* script para página de favoritos: carrega serviços favoritados do usuário, exibe em cards, 
lida com remoção de favoritos e casos de erro. Também redireciona para login se usuário não estiver autenticado. */

document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("favoritos-list");
  const toast = (msg) => {
    let t = document.querySelector(".module-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "module-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(window.__mt);
    window.__mt = setTimeout(() => t.classList.remove("show"), 2200);
  };
  if (!window.Workly.getToken()) {
    location.href = "login.html";
    return;
  }
  // busca os favoritos do usuário logado e monta os cards na tela.
  async function load() {
    list.innerHTML = window.Workly.loadingMarkup("Carregando favoritos...");
    try {
      const res = await window.Workly.apiFetch("/api/favoritos");
      const favoritos = res.dados || [];
      if (!favoritos.length) {
        list.innerHTML =
          '<div class="empty-module"><i class="far fa-heart"></i><h3>Nenhum favorito ainda</h3><p>Salve serviços pela página de detalhes para acessar depois.</p><a class="module-btn primary" href="todos-servicos.html">Ver serviços</a></div>';
        return;
      }
      list.innerHTML = favoritos.map((f) => card(f.servico)).join("");
      list.querySelectorAll("[data-remove]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await window.Workly.apiFetch(
            `/api/favoritos/servico/${btn.dataset.remove}`,
            { method: "DELETE" },
          );
          toast("Removido dos favoritos");
          load();
        }),
      );
    } catch (e) {
      list.innerHTML = `<div class="empty-module"><i class="fas fa-triangle-exclamation"></i><h3>Erro ao carregar</h3><p>${e.message}</p></div>`;
    }
  }

  function card(s) {
    if (!s) return "";
    return `<article class="module-card"><img class="module-card-img" loading="lazy" decoding="async" src="${s.imagemServico || "../assets/img/servicos/servico_padrao.svg"}" onerror="this.src='../assets/img/servicos/servico_padrao.svg'" alt=""><div class="module-card-body"><h3>${esc(s.nome)}</h3><p>${esc((s.descricao || "").slice(0, 110))}</p><div class="module-meta"><span class="module-pill"><i class="fas fa-layer-group"></i>${esc(s.nomeCategoria || "Categoria")}</span><span class="module-pill"><i class="fas fa-user"></i>${esc(s.nomeFreelancer || "Freelancer")}</span></div><strong>${s.valorCombinar ? "Valor a combinar" : window.Workly.formatCurrency(s.preco)}</strong><div class="module-actions"><a class="module-btn primary" href="detalhe-servico.html?id=${s.idServico}">Ver serviço</a><button class="module-btn danger" data-remove="${s.idServico}"><i class="fas fa-trash"></i>Remover</button></div></div></article>`;
  }

  function esc(t = "") {
    return String(t).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[m],
    );
  }
  load();
});
