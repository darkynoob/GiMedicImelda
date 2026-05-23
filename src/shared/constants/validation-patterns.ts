/**
 * Patrones de validación compartidos entre DTOs y servicios de dominio.
 * Centralizar aquí evita definiciones duplicadas y garantiza consistencia.
 */

/** CURP mexicana: 4 letras + 6 dígitos (fecha) + H/M + 5 letras + alfanumérico + dígito */
export const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

/** RFC mexicano: 3-4 letras + 6 dígitos (fecha) + 3 caracteres alfanuméricos */
export const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;

/** Teléfono: 7–20 caracteres entre dígitos, espacios, guiones, +, paréntesis */
export const PHONE_REGEX = /^[\d\s\-+()]{7,20}$/;
