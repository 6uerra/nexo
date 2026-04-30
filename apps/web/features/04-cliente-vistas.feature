# language: es
@regression @cliente
Característica: Vistas operativas del cliente
  Como Cliente
  Quiero ver mis datos sembrados (vehículos, conductores, contratos, etc.)

  Antecedentes:
    Dado estoy autenticado como "cliente"

  @smoke
  Esquema del escenario: Cada vista operativa muestra data demo
    Cuando visito "<ruta>"
    Entonces veo el texto "<dato>"

    Ejemplos: vistas con su dato esperado
      | ruta        | dato                |
      | /vehicles   | ABC-123             |
      | /vehicles   | Toyota              |
      | /drivers    | Juan Pérez          |
      | /owners     | Carlos Rodríguez    |
      | /owners     | Bancolombia         |
      | /contracts  | CT-2026-001         |
      | /billing    | Cobrado a clientes  |
      | /billing    | Pagado a propietarios |
