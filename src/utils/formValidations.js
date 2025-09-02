// src/utils/formUtils.js

/**
 * Verifica si el formulario es válido.
 * @param {object} formData - Los valores del formulario.
 * @param {object} formErrors - Los errores actuales del formulario.
 * @param {string[]} requiredFields - Campos que son obligatorios.
 * @returns {boolean} - true si todo está válido, false si falta algo.
 */
export function isFormValid(formData, formErrors, requiredFields = []) {
  // Si hay algún error no vacío -> inválido
  for (const key in formErrors) {
    if (formErrors[key]) {
      return false;
    }
  }

  // Si algún campo obligatorio está vacío -> inválido
  for (const field of requiredFields) {
    if (!formData[field] || formData[field].toString().trim() === "") {
      return false;
    }
  }

  return true;
}