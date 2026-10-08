// PLAK BioSite - Configurações
// ================================
// MUDE OS PREÇOS AQUI! É só alterar os valores abaixo.

export const APP_NAME = "PLAK BioSite";
export const VERSION = "1.0.0";

// =====================================
// 💰 PREÇOS - MUDE COMO QUISER!
// =====================================
export const PLANS = [
  {
    id: "creation",
    name: "Criação Única",
    description: "Valor único por Bio Site",
    price: 397, // MUDE AQUI! Ex: 197, 297, 497, 597...
    interval: "once" as const,
    features: [
      "Bio Site completo",
      "QR Code incluso",
      "Links ilimitados",
      "Sem mensalidade"
    ]
  },
  {
    id: "starter",
    name: "Starter",
    description: "Mensalidade básica",
    price: 49, // MUDE AQUI! Ex: 29, 39, 59, 79...
    interval: "monthly" as const,
    features: [
      "Bio Site ativo",
      "Até 10 links",
      "QR Code incluso",
      "Suporte WhatsApp"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    description: "Mensalidade completa",
    price: 97, // MUDE AQUI! Ex: 67, 97, 127, 147...
    interval: "monthly" as const,
    features: [
      "Tudo do Starter",
      "Links ilimitados",
      "Analytics (views, cliques)",
      "Domínio personalizado",
      "Prioridade no suporte"
    ]
  },
  {
    id: "business",
    name: "Business",
    description: "Para múltiplas empresas",
    price: 147, // MUDE AQUI! Ex: 97, 147, 197, 247...
    interval: "monthly" as const,
    features: [
      "Tudo do Pro",
      "Múltiplos Bio Sites",
      "API access",
      "Gerente de conta",
      "Suporte prioritário"
    ]
  },
];

// =====================================
// 🎨 TEMAS (pode mudar cores se quiser)
// =====================================
export const DEFAULT_THEMES = [
  { id: "minimal", name: "Minimal", background: "#ffffff", text: "#1d1d1f", accent: "#007aff", buttonStyle: "pill" as const },
  { id: "dark", name: "Dark", background: "#1d1d1f", text: "#f5f5f7", accent: "#0a84ff", buttonStyle: "rounded" as const },
  { id: "gradient", name: "Gradient", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", text: "#ffffff", accent: "#ffffff", buttonStyle: "rounded" as const },
  { id: "nature", name: "Nature", background: "#f0f7f4", text: "#2d5016", accent: "#4a7c23", buttonStyle: "pill" as const },
  { id: "ocean", name: "Ocean", background: "#e3f2fd", text: "#0d47a1", accent: "#1976d2", buttonStyle: "rounded" as const },
  { id: "sunset", name: "Sunset", background: "#fff3e0", text: "#e65100", accent: "#ff6d00", buttonStyle: "pill" as const },
];

// =====================================
// 📱 ÍCONES DE REDES SOCIAIS
// =====================================
export const SOCIAL_ICONS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "Twitter",
  whatsapp: "WhatsApp",
  email: "Email",
  phone: "Telefone",
  website: "Website",
  maps: "Localização",
};

// =====================================
// 📋 TEMPLATES POR NICHO
// =====================================
export const TEMPLATES = [
  { id: "restaurante", name: "Restaurante", category: "restaurante" },
  { id: "clinica", name: "Clínica", category: "clinica" },
  { id: "loja", name: "Loja", category: "loja" },
  { id: "servicos", name: "Serviços", category: "servicos" },
  { id: "evento", name: "Evento", category: "evento" },
];

// =====================================
// 💡 EXEMPLOS DE COMO MUDAR OS PREÇOS
// =====================================

/*
// Exemplo 1: Preços mais baixos (pra começar)
export const PLANS = [
  { id: "creation", name: "Criação Única", price: 197, interval: "once" as const, features: ["Bio Site completo"] },
  { id: "starter", name: "Starter", price: 29, interval: "monthly" as const, features: ["Até 10 links"] },
  { id: "pro", name: "Pro", price: 59, interval: "monthly" as const, features: ["Links ilimitados"] },
  { id: "business", name: "Business", price: 97, interval: "monthly" as const, features: ["Múltiplos Bio Sites"] },
];

// Exemplo 2: Só criação única (sem mensalidade)
export const PLANS = [
  { id: "creation", name: "Básico", price: 297, interval: "once" as const, features: ["5 links"] },
  { id: "pro", name: "Profissional", price: 497, interval: "once" as const, features: ["Links ilimitados"] },
  { id: "premium", name: "Premium", price: 697, interval: "once" as const, features: ["Tudo + QR Code impresso"] },
];

// Exemplo 3: Preços premium
export const PLANS = [
  { id: "creation", name: "Criação Única", price: 597, interval: "once" as const, features: ["Bio Site completo"] },
  { id: "starter", name: "Starter", price: 79, interval: "monthly" as const, features: ["Até 10 links"] },
  { id: "pro", name: "Pro", price: 147, interval: "monthly" as const, features: ["Links ilimitados"] },
  { id: "business", name: "Business", price: 247, interval: "monthly" as const, features: ["Múltiplos Bio Sites"] },
];
*/
