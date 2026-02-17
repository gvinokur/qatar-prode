#!/bin/bash
# Finds hardcoded Spanish strings in component files

echo "Searching for hardcoded Spanish strings..."
echo ""

# Common Spanish words/patterns to search for
PATTERNS=(
  "Crear "
  "Guardar"
  "Cancelar"
  "Eliminar"
  "Confirmar"
  "Borrar"
  "nombre"
  "contraseña"
  "correo"
  "email"
  "E-Mail"
  "Por favor"
  "debe tener"
  "es requerido"
  "es obligatorio"
  "¿Estás seguro"
  "Este enlace"
  "Tu "
  "tu "
  "para "
)

for pattern in "${PATTERNS[@]}"; do
  echo "=== Searching for: '$pattern' ==="
  grep -r --include="*.tsx" --include="*.ts" -n "$pattern" app/ | head -20
  echo ""
done

echo "Search complete. Review results for hardcoded strings."
