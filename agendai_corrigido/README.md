# AgendAI - SaaS para Barbearias Premium

Sistema de agendamentos, métricas e gestão de comissões para barbearias e salões.

## 🚀 Tecnologias

- **React 18** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Lucide React** (Ícones)

## 📁 Estrutura de Arquivos

```
agendai/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Header.tsx        # Cabeçalho mobile com status em tempo real
│   │       └── Sidebar.tsx       # Navegação lateral com menu e organização
│   ├── data/
│   │   └── mockData.ts           # Dados iniciais e demonstração
│   ├── types/
│   │   └── index.ts              # Interfaces e tipos TypeScript
│   ├── views/
│   │   ├── AuthOnboardingView.tsx       # Cadastro de nova barbearia
│   │   ├── DashboardView.tsx            # Agenda do dia e indicadores de receita
│   │   ├── ServicesAndCommissionsView.tsx # Catálogo de serviços e taxas de comissão
│   │   └── TenantBookingView.tsx        # Portal público do cliente (4 etapas)
│   ├── App.tsx                   # Componente raiz com controle de estado
│   ├── index.css                 # Configuração Tailwind CSS
│   └── main.tsx                  # Ponto de entrada da aplicação
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🛠️ Como Executar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Para gerar a build de produção:
   ```bash
   npm run build
   ```

## 🔐 Segurança e banco Cloudflare (obrigatório em produção)

O painel administrativo agora exige cadastro real, senha validada no servidor e sessão autenticada. Para manter os dados persistentes e protegidos no Cloudflare, configure um namespace **Workers KV** com o binding exato `AGENDAI_KV` antes do deploy.

Exemplo com Wrangler:

```bash
npx wrangler kv namespace create AGENDAI_KV
```

O comando retorna o `id` do namespace. Adicione o binding ao `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "AGENDAI_KV",
    "id": "ID_RETORNADO_PELO_CLOUDFLARE"
  }
]
```

Depois execute:

```bash
npm install
npm run build
npm run deploy
```

### Alterações de segurança desta versão

- Login inexistente ou senha errada é bloqueado pelo servidor.
- Senhas novas são derivadas com PBKDF2/SHA-256 e salt; a senha não volta para o navegador.
- Leitura administrativa por e-mail e gravação de dados exigem token de sessão.
- Link público por slug não expõe senha, e-mail administrativo, clientes nem telefones privados.
- Links antigos `?sync_data=...` não autenticam mais o painel.
- Transferência que permitia “Importar e Entrar” sem validar senha foi removida.
- O fallback público `kv.val.run` foi removido do frontend.
