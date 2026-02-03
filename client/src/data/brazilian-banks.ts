// Dataset de Bancos Brasileiros com logos locais em SVG
// Logos do repositório: https://github.com/Tgentil/Bancos-em-SVG

export interface BrazilianBank {
  slug: string;
  code: string;
  name: string;
  shortName: string;
  logo: string;
  color: string;
  ispb?: string;
}

export const BRAZILIAN_BANKS: BrazilianBank[] = [
  // Grandes Bancos
  { slug: "banco-do-brasil", code: "001", name: "Banco do Brasil S.A.", shortName: "Banco do Brasil", logo: "/banks/Banco do Brasil S.A/banco-do-brasil-com-fundo.svg", color: "#FFEF00" },
  { slug: "bradesco", code: "237", name: "Banco Bradesco S.A.", shortName: "Bradesco", logo: "/banks/Bradesco S.A/bradesco.svg", color: "#CC092F" },
  { slug: "itau-unibanco", code: "341", name: "Itaú Unibanco S.A.", shortName: "Itaú", logo: "/banks/Itaú Unibanco S.A/itau.svg", color: "#EC7000" },
  { slug: "santander", code: "033", name: "Banco Santander Brasil S.A.", shortName: "Santander", logo: "/banks/Banco Santander Brasil S.A/banco-santander-logo.svg", color: "#EC0000" },
  { slug: "caixa", code: "104", name: "Caixa Econômica Federal", shortName: "Caixa", logo: "/banks/Caixa Econômica Federal/caixa-economica-federal-1.svg", color: "#005CA9" },
  
  // Bancos Digitais / Fintechs
  { slug: "nubank", code: "260", name: "Nu Pagamentos S.A.", shortName: "Nubank", logo: "/banks/Nu Pagamentos S.A/nubank-logo-2021.svg", color: "#820AD1" },
  { slug: "inter", code: "077", name: "Banco Inter S.A.", shortName: "Inter", logo: "/banks/Banco Inter S.A/inter.svg", color: "#FF7A00" },
  { slug: "c6", code: "336", name: "Banco C6 S.A.", shortName: "C6 Bank", logo: "/banks/Banco C6 S.A/c6 bank.svg", color: "#242424" },
  { slug: "neon", code: "735", name: "Neon Pagamentos S.A.", shortName: "Neon", logo: "/banks/Neon/header-logo-neon.svg", color: "#00E5A0" },
  { slug: "original", code: "212", name: "Banco Original S.A.", shortName: "Original", logo: "/banks/Banco Original S.A/banco-original-logo-verde.svg", color: "#00A857" },
  { slug: "btg-pactual", code: "208", name: "Banco BTG Pactual S.A.", shortName: "BTG Pactual", logo: "/banks/Banco BTG Pacutal/btg-pactual.svg", color: "#001E62" },
  { slug: "xp", code: "102", name: "XP Investimentos", shortName: "XP", logo: "/banks/XP Investimentos/xp-investimentos-logo.svg", color: "#000000" },
  { slug: "sofisa", code: "637", name: "Banco Sofisa S.A.", shortName: "Sofisa", logo: "/banks/Banco Sofisa/logo-sofisa.svg", color: "#00A857" },
  { slug: "bmg", code: "318", name: "Banco BMG S.A.", shortName: "BMG", logo: "/banks/Banco BMG/banco-bmg-logo.svg", color: "#FF6600" },
  { slug: "daycoval", code: "707", name: "Banco Daycoval S.A.", shortName: "Daycoval", logo: "/banks/Banco Daycoval/logo-Daycoval.svg", color: "#003366" },
  { slug: "bs2", code: "218", name: "Banco BS2 S.A.", shortName: "BS2", logo: "/banks/Banco BS2 S.A/Banco_BS2.svg", color: "#00D4AA" },
  { slug: "stone", code: "197", name: "Stone Pagamentos S.A.", shortName: "Stone", logo: "/banks/Stone Pagamentos S.A/stone.svg", color: "#00A868" },
  { slug: "cora", code: "403", name: "Cora Sociedade de Crédito Direto S.A.", shortName: "Cora", logo: "/banks/Cora Sociedade Credito Direto S.A/icone-cora-rosa-2500px.svg", color: "#FE3E6D" },

  // Cooperativas
  { slug: "sicoob", code: "756", name: "Sicoob", shortName: "Sicoob", logo: "/banks/Sicoob/sicoob-vector-logo.svg", color: "#003641" },
  { slug: "sicredi", code: "748", name: "Sicredi", shortName: "Sicredi", logo: "/banks/Sicredi/logo-svg2.svg", color: "#00A651" },
  { slug: "unicred", code: "136", name: "Unicred", shortName: "Unicred", logo: "/banks/Unicred/verde.svg", color: "#00529B" },
  { slug: "cresol", code: "133", name: "Cresol", shortName: "Cresol", logo: "/banks/Cresol/Icone-original.svg", color: "#00A651" },
  { slug: "ailos", code: "085", name: "Ailos", shortName: "Ailos", logo: "/banks/Ailos/logo-ailos.svg", color: "#00A651" },
  { slug: "credisis", code: "097", name: "Credisis", shortName: "Credisis", logo: "/banks/Credisis/credisis.svg", color: "#003087" },
  { slug: "uniprime", code: "099", name: "Uniprime", shortName: "Uniprime", logo: "/banks/Uniprime/uniprime.svg", color: "#003087" },
  { slug: "sulcredi", code: "174", name: "Sulcredi", shortName: "Sulcredi", logo: "/banks/Sulcredi/marca.svg", color: "#003087" },
  { slug: "sisprime", code: "084", name: "Sisprime", shortName: "Sisprime", logo: "/banks/Sisprime/logo.svg", color: "#003087" },
  
  // Bancos de Pagamento / Carteiras Digitais
  { slug: "picpay", code: "380", name: "PicPay Serviços S.A.", shortName: "PicPay", logo: "/banks/PicPay/Logo-PicPay.svg", color: "#21C25E" },
  { slug: "mercadopago", code: "323", name: "Mercado Pago", shortName: "Mercado Pago", logo: "/banks/Mercado Pago/mercado-pago.svg", color: "#00B1EA" },
  { slug: "pagseguro", code: "290", name: "PagSeguro Internet S.A.", shortName: "PagBank", logo: "/banks/PagSeguro Internet S.A/logo-pagbank.svg", color: "#FFC800" },
  { slug: "recargapay", code: "383", name: "RecargaPay", shortName: "RecargaPay", logo: "/banks/RecargaPay/RecargaPay.svg", color: "#FF6B00" },
  { slug: "ifood", code: "529", name: "iFood Pagamentos", shortName: "iFood", logo: "/banks/Ifood Pago/LOGO-IFOOD-PAGO-BRANCO.svg", color: "#EA1D2C" },
  { slug: "infinitepay", code: "306", name: "InfinitePay", shortName: "InfinitePay", logo: "/banks/InfinitePay/InfitePay.svg", color: "#000000" },
  { slug: "magalupay", code: "301", name: "MagaluPay", shortName: "MagaluPay", logo: "/banks/MagaluPay/logo-magalupay.svg", color: "#0086FF" },
  { slug: "paycash", code: "379", name: "PayCash", shortName: "PayCash", logo: "/banks/PayCash/logo.svg", color: "#003087" },

  // Outros Bancos
  { slug: "safra", code: "422", name: "Banco Safra S.A.", shortName: "Safra", logo: "/banks/Banco Safra S.A/logo-safra.svg", color: "#003087" },
  { slug: "votorantim", code: "655", name: "Banco Votorantim S.A.", shortName: "BV", logo: "/banks/Banco Votorantim/banco-bv-logo.svg", color: "#0066CC" },
  { slug: "abc-brasil", code: "246", name: "Banco ABC Brasil S.A.", shortName: "ABC Brasil", logo: "/banks/ABC Brasil/logoabc.svg", color: "#003366" },
  { slug: "banrisul", code: "041", name: "Banrisul", shortName: "Banrisul", logo: "/banks/Banrisul/banrisul-logo-2023.svg", color: "#004B87" },
  { slug: "bnb", code: "004", name: "Banco do Nordeste do Brasil S.A.", shortName: "BNB", logo: "/banks/Banco do Nordeste do Brasil S.A/Logo_BNB.svg", color: "#E30613" },
  { slug: "basa", code: "003", name: "Banco da Amazônia S.A.", shortName: "BASA", logo: "/banks/Banco da Amazônia S.A/banco-da-amazonia.svg", color: "#006633" },
  { slug: "brb", code: "070", name: "BRB - Banco de Brasília", shortName: "BRB", logo: "/banks/BRB - Banco de Brasilia/brb-logo.svg", color: "#003399" },
  { slug: "banco-pine", code: "643", name: "Banco Pine S.A.", shortName: "Pine", logo: "/banks/Banco Pine/banco-pine.svg", color: "#006341" },
  { slug: "rendimento", code: "633", name: "Banco Rendimento S.A.", shortName: "Rendimento", logo: "/banks/Banco Rendimento/banco rendimento logo nova .svg", color: "#003366" },
  { slug: "tribanco", code: "634", name: "Banco Triângulo S.A.", shortName: "Tribanco", logo: "/banks/Banco Triângulo - Tribanco/logotribanco.svg", color: "#E30613" },
  { slug: "banestes", code: "021", name: "Banco do Estado do Espírito Santo", shortName: "Banestes", logo: "/banks/Banco do Estado do Espirito Santo/banestes.svg", color: "#003087" },
  { slug: "banese", code: "047", name: "Banco do Estado de Sergipe", shortName: "Banese", logo: "/banks/Banco do Estado do Sergipe/logo banese.svg", color: "#003087" },
  { slug: "banpara", code: "037", name: "Banco do Estado do Pará", shortName: "Banpará", logo: "/banks/Banco do Estado do Para/banpara-logo-sem-fundo.svg", color: "#003087" },
  { slug: "banco-industrial", code: "604", name: "Banco Industrial do Brasil S.A.", shortName: "Industrial", logo: "/banks/Banco Industrial do Brasil S.A/BIB-logo.svg", color: "#003087" },
  { slug: "banco-paulista", code: "611", name: "Banco Paulista S.A.", shortName: "Paulista", logo: "/banks/Banco Paulista/banco-paulista.svg", color: "#003087" },
  { slug: "mercantil", code: "389", name: "Banco Mercantil do Brasil S.A.", shortName: "Mercantil", logo: "/banks/Banco Mercantil do Brasil S.A/banco-mercantil-novo-azul.svg", color: "#003087" },
  { slug: "topazio", code: "082", name: "Banco Topázio S.A.", shortName: "Topázio", logo: "/banks/Banco Topazio/logo-banco-topazio.svg", color: "#003087" },
  { slug: "arbi", code: "213", name: "Banco Arbi S.A.", shortName: "Arbi", logo: "/banks/Banco Arbi/Banco_Arbi .svg", color: "#003087" },
  { slug: "bmp", code: "274", name: "Banco BMP S.A.", shortName: "BMP", logo: "/banks/Banco BMP/logo_bmp.svg", color: "#003087" },

  // Fintechs e Novos Bancos
  { slug: "asaas", code: "461", name: "Asaas Gestão Financeira", shortName: "Asaas", logo: "/banks/Asaas IP S.A/header-logo-azul.svg", color: "#0066FF" },
  { slug: "efi", code: "364", name: "Efí S.A. (Gerencianet)", shortName: "Efí", logo: "/banks/Efí - Gerencianet/logo-efi-bank-laranja.svg", color: "#00B4D8" },
  { slug: "conta-simples", code: "487", name: "Conta Simples Soluções em Pagamentos", shortName: "Conta Simples", logo: "/banks/Conta Simples Soluções em Pagamentos/conta-simples_logo-novo.svg", color: "#6366F1" },
  { slug: "transfeera", code: "457", name: "Transfeera Pagamentos S.A.", shortName: "Transfeera", logo: "/banks/Transfera/transfeera-logo-verde-nova.svg", color: "#00C896" },
  { slug: "grafeno", code: "332", name: "Grafeno Pagamentos S.A.", shortName: "Grafeno", logo: "/banks/Grafeno/grafeno.svg", color: "#1A1A2E" },
  { slug: "linker", code: "457", name: "Linker Tecnologia", shortName: "Linker", logo: "/banks/Linker/logo.svg", color: "#FF6B35" },
  { slug: "omie", code: "613", name: "Omie.cash", shortName: "Omie", logo: "/banks/Omie.Cash/omie.svg", color: "#00A3E0" },
  { slug: "capitual", code: "536", name: "Capitual", shortName: "Capitual", logo: "/banks/Capitual/logo capitual.svg", color: "#003087" },
  { slug: "contbank", code: "412", name: "Contbank", shortName: "Contbank", logo: "/banks/Contbank/logo-contbank.svg", color: "#003087" },
  { slug: "duepay", code: "408", name: "DuePay", shortName: "DuePay", logo: "/banks/DuePay/Duepay.svg", color: "#003087" },
  { slug: "iugu", code: "401", name: "Iugu Instituição de Pagamento S.A.", shortName: "Iugu", logo: "/banks/Iugo/Iugo.svg", color: "#6772E5" },
  { slug: "ip4y", code: "439", name: "IP4Y", shortName: "IP4Y", logo: "/banks/Ip4y/logo-blue.svg", color: "#003087" },
  { slug: "letsbank", code: "630", name: "Lets Bank S.A.", shortName: "Lets Bank", logo: "/banks/Lets Bank S.A/Logo Letsbank.svg", color: "#003087" },
  { slug: "modobank", code: "465", name: "ModoBank", shortName: "ModoBank", logo: "/banks/ModoBank/logo.svg", color: "#003087" },
  { slug: "multiplo", code: "125", name: "Múltiplo Bank", shortName: "Múltiplo", logo: "/banks/Multiplo Bank/logotipo.svg", color: "#003087" },
  { slug: "omni", code: "613", name: "Omni Banco", shortName: "Omni", logo: "/banks/Omni/logo-omni.svg", color: "#003087" },
  { slug: "pinbank", code: "094", name: "PinBank", shortName: "PinBank", logo: "/banks/PinBank/pinBank.svg", color: "#003087" },
  { slug: "quality", code: "331", name: "Quality Digital Bank", shortName: "Quality", logo: "/banks/Quality Digital Bank/quality-logo-cinza.svg", color: "#003087" },
  { slug: "squid", code: "329", name: "Squid Soluções Financeiras", shortName: "Squid", logo: "/banks/Squid Soluções Financeiras/logo.svg", color: "#003087" },
  { slug: "starbank", code: "373", name: "StarBank", shortName: "StarBank", logo: "/banks/StarBank/logo.svg", color: "#003087" },
  { slug: "zemo", code: "359", name: "Zemo Bank", shortName: "Zemo", logo: "/banks/Zemo Bank/logowhite.svg", color: "#003087" },

  // Bancos Internacionais no Brasil
  { slug: "bnp-paribas", code: "752", name: "BNP Paribas Brasil S.A.", shortName: "BNP Paribas", logo: "/banks/BNP Paripas/logo-bnp.svg", color: "#00915A" },
  { slug: "bank-of-america", code: "755", name: "Bank of America Merrill Lynch", shortName: "Bank of America", logo: "/banks/Bank of America/bankofamerica-logo.svg", color: "#012169" },
  { slug: "mufg", code: "456", name: "MUFG Bank", shortName: "MUFG", logo: "/banks/MUFG/mufg-seeklogo.svg", color: "#E60012" },
  
  // Outros
  { slug: "bees", code: "144", name: "Bees Bank", shortName: "Bees", logo: "/banks/Bees Bank/BEESBank_Horizontal.svg", color: "#FFD100" },
  { slug: "bkbank", code: "249", name: "BK Bank", shortName: "BK Bank", logo: "/banks/BK Bank/bkBank.svg", color: "#003087" },
  
  // Carteira / Dinheiro Físico (opção genérica)
  { slug: "carteira", code: "000", name: "Carteira / Dinheiro", shortName: "Carteira", logo: "/banks/default-bank.svg", color: "#64748B" },
];

// Função para buscar banco por código
export function getBankByCode(code: string): BrazilianBank | undefined {
  return BRAZILIAN_BANKS.find(bank => bank.code === code);
}

// Função para buscar banco por slug
export function getBankBySlug(slug: string): BrazilianBank | undefined {
  return BRAZILIAN_BANKS.find(bank => bank.slug === slug);
}

// Função para buscar bancos por termo (nome ou código)
export function searchBanks(term: string): BrazilianBank[] {
  const normalizedTerm = term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return BRAZILIAN_BANKS.filter(bank => {
    const normalizedName = bank.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedShortName = bank.shortName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return (
      normalizedName.includes(normalizedTerm) ||
      normalizedShortName.includes(normalizedTerm) ||
      bank.code.includes(term)
    );
  });
}

// Fallback logo para bancos sem logo
export const BANK_FALLBACK_LOGO = '/banks/default-bank.svg';

// Função para obter logo com fallback
export function getBankLogo(bank: BrazilianBank | null | undefined): string {
  if (!bank) return BANK_FALLBACK_LOGO;
  return bank.logo || BANK_FALLBACK_LOGO;
}
