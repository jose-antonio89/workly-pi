export const routeDefinitions = [
  { path: '/', alias: '/pages/index.html', pageFile: 'HomePage.jsx', protected: false },
  { path: '/sobre', alias: '/pages/sobre.html', pageFile: 'AboutPage.jsx', protected: false },
  { path: '/login', alias: '/pages/login.html', pageFile: 'LoginPage.jsx', protected: false },
  {
    path: '/cadastro',
    alias: '/pages/cadastro.html',
    pageFile: 'RegisterPage.jsx',
    protected: false
  },
  {
    path: '/todos-servicos',
    alias: '/pages/todos-servicos.html',
    pageFile: 'AllServicesPage.jsx',
    protected: false
  },
  {
    path: '/categorias',
    alias: '/pages/categorias.html',
    pageFile: 'CategoryPage.jsx',
    protected: false
  },
  {
    path: '/detalhe-servico',
    alias: '/pages/detalhe-servico.html',
    pageFile: 'ServiceDetailPage.jsx',
    protected: false
  },
  {
    path: '/perfil-publico',
    alias: '/pages/perfil-publico.html',
    pageFile: 'PublicProfilePage.jsx',
    protected: false
  },
  { path: '/perfil', alias: '/pages/perfil.html', pageFile: 'ProfilePage.jsx', protected: true },
  {
    path: '/anuncio',
    alias: '/pages/anuncio.html',
    pageFile: 'ServiceEditorPage.jsx',
    protected: true
  },
  {
    path: '/editar-servico',
    alias: '/pages/editar-servico.html',
    pageFile: 'ServiceEditorPage.jsx',
    protected: true
  },
  {
    path: '/contratar-servico',
    alias: '/pages/contratar-servico.html',
    pageFile: 'HirePage.jsx',
    protected: true
  },
  {
    path: '/negociar-servico',
    alias: '/pages/negociar-servico.html',
    pageFile: 'ProposalPage.jsx',
    protected: true
  },
  {
    path: '/contratos',
    alias: '/pages/contratos.html',
    pageFile: 'ContractsPage.jsx',
    protected: true
  },
  {
    path: '/contrato-chat',
    alias: '/pages/contrato-chat.html',
    pageFile: 'ContractChatPage.jsx',
    protected: true
  },
  {
    path: '/mensagens',
    alias: '/pages/mensagens.html',
    pageFile: 'MessagesPage.jsx',
    protected: true
  },
  {
    path: '/favoritos',
    alias: '/pages/favoritos.html',
    pageFile: 'FavoritesPage.jsx',
    protected: true
  }
];

export const routeAliases = Object.fromEntries(
  routeDefinitions.map(({ alias, path }) => [alias, path])
);

export function aliasDestination(url, aliases = routeAliases) {
  const parsed = new URL(url, 'http://workly.local');
  const destination = Object.hasOwn(aliases, parsed.pathname) ? aliases[parsed.pathname] : null;
  return destination ? destination + parsed.search + parsed.hash : null;
}
