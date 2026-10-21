"use strict";

const CNPJ_PATTERN = /^\d{14}$/;
const UID_PATTERN = /^[A-Za-z0-9_-]{6,128}$/;

function validarPedidoAdministrativo(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Dados inválidos.");
  const { uidSolicitante, acao, vinculoVerificado, justificativa } = input;
  if (typeof uidSolicitante !== "string" || !UID_PATTERN.test(uidSolicitante)) throw new Error("Solicitante inválido.");
  if (acao !== "aprovar" && acao !== "rejeitar") throw new Error("Ação inválida.");
  if (typeof justificativa !== "string" || justificativa.trim().length < 15 || justificativa.trim().length > 500) throw new Error("Informe uma justificativa entre 15 e 500 caracteres.");
  if (acao === "aprovar" && vinculoVerificado !== true) throw new Error("Confirme a verificação documental do vínculo antes de aprovar.");
  return { uidSolicitante, acao, justificativa: justificativa.trim() };
}

function validarRegistroSolicitado(documento, uidSolicitante, emailAtual) {
  if (!documento || typeof documento !== "object") throw new Error("Solicitação não encontrada.");
  if (documento.uid_responsavel !== uidSolicitante) throw new Error("Responsável inconsistente.");
  if (documento.email_responsavel?.toLowerCase() !== emailAtual?.toLowerCase()) throw new Error("E-mail do responsável não corresponde ao Authentication.");
  if (typeof documento.cnpj !== "string" || !CNPJ_PATTERN.test(documento.cnpj)) throw new Error("CNPJ inválido.");
  if (typeof documento.razao_social !== "string" || documento.razao_social.trim().length < 2) throw new Error("Razão social inválida.");
  if (!["aguardando_analise", "aprovada", "rejeitada"].includes(documento.status)) throw new Error("Status inválido.");
  return { cnpj: documento.cnpj, empresaId: "empresa_" + documento.cnpj, status: documento.status };
}

module.exports = { validarPedidoAdministrativo, validarRegistroSolicitado };
