const pdfParse = require("pdf-parse");

function cleanText(str) {
  return (str || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function matchRegex(text, regex) {
  const m = text.match(regex);
  return m && m[1] ? cleanText(m[1]) : null;
}

function pickFirstNonEmptyLine(block) {
  if (!block) return null;
  const lines = block.split("\n").map(l => cleanText(l));
  for (const line of lines) {
    if (line) return line;
  }
  return null;
}

function parseQuantidade(raw) {
  if (!raw) return null;
  let s = String(raw).replace(/\./g, "").replace(",", ".").trim();
  const n = Number(s);
  if (!isFinite(n)) return null;
  // maioria é inteira
  return Math.round(n);
}

function extractFieldsFromText(textRaw) {
  const text = cleanText(textRaw);

  const emissao = matchRegex(text, /EMISS[ÃA]O[^0-9]*([0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4})/i);

  // Procura especificamente pela data em vermelho na OP
  const dataEntrega = matchRegex(text, /(?:DATA DE ENTREGA|PRAZO DE ENTREGA)[^0-9]*([0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4})/i);

  const numeroOP = matchRegex(text, /ORDEM DE PRODU[ÇC][ÃA]O\s*N[º°]?\s*([0-9.\sA-Z]+?)(?:\s{2,}|\n|CLIENTE|$)/i);

  const cliente = matchRegex(text, /CLIENTE:\s*([^\n]+)/i);

  // Produto: pegar Pin gaveta, Pin Relevo, etc.
  let produto = matchRegex(text, /PRODUTO:\s*([^\n]+)/i);
  // Se encontrou, tenta extrair apenas o tipo de Pin
  if (produto) {
    const pinMatch = produto.match(/(Pin\s+[^\s,]+)/i);
    if (pinMatch) {
      produto = pinMatch[1];
    }
  }

  // Quantidade: procurar em todas as variações possíveis
  let quantidadeTotal =
    matchRegex(text, /QUANTIDADE\s+TOTAL[:\s]*([0-9.,]+)/i) ||
    matchRegex(text, /QTD(?:\s+TOTAL)?[:\s]*([0-9.,]+)/i) ||
    matchRegex(text, /QUANTIDADE[:\s]*([0-9.,]+)/i) ||
    matchRegex(text, /(?:TOTAL|QTD)[:\s]*([0-9.,]+)/i);
  
  // Garantir que temos um número
  const quantidadeParsed = parseQuantidade(quantidadeTotal);

  return {
    emissao,
    dataEntrega,
    numeroOP,
    cliente,
    produto,
    quantidadeTotal: quantidadeParsed != null ? String(quantidadeParsed) : quantidadeTotal
  };
}

async function parseOPPdf(buffer) {
  const data = await pdfParse(buffer);
  return extractFieldsFromText(data.text || "");
}

module.exports = { parseOPPdf };
