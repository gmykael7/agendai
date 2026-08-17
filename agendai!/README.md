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
