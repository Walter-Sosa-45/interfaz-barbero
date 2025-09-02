// src/utils/validators.js

// Solo letras (con acentos y ñ) + espacios
export function validateName(value, maxLength = 50) {
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {
    return "Solo se permiten letras";
  } else if (value.length > maxLength) {
    return `Máximo ${maxLength} caracteres`;
  }
  return "";
}

// Solo dígitos (teléfono, DNI, etc.)
export function validateDigits(value, maxLength = 15) {
  if (!/^\d*$/.test(value)) {
    return "Solo se permiten números";
  } else if (value.length > maxLength) {
    return `Máximo ${maxLength} dígitos`;
  }
  return "";
}

// Validar email
export function validateEmail(value) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Formato de correo inválido";
  }
  return "";
}

// Campo obligatorio
export function validateRequired(value) {
  if (!value || value.trim() === "") {
    return "Este campo es obligatorio";
  }
  return "";
}

// Validacion de descripciones o motivos
export function validateText(value, maxLength = 100) {
  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,-]*$/.test(value)) {
    return "Solo letras, números y ., -";
  } else if (value.length > maxLength) {
    return `Máximo ${maxLength} caracteres`;
  }
  return "";
}
