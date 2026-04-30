# language: es
@regression @e2e @plan-sync
Característica: Sincronización Plan ↔ Vistas del Cliente
  Como Admin
  Quiero que al cambiar el plan del cliente, automáticamente se le habiliten/bloqueen
  los módulos correspondientes (Backend ↔ Frontend en sincronía)

  Esquema del escenario: El plan controla qué módulos ve el cliente en su sidebar
    Dado que el admin cambia el plan del cliente demo a "<plan>"
    Cuando inicio sesión como "cliente"
    Entonces el sidebar contiene "<modulo_visible>"
    Y el módulo "<modulo_bloqueado>" aparece bloqueado en el sidebar

    Ejemplos: módulos no incluidos en cada plan
      | plan       | modulo_visible | modulo_bloqueado |
      | standard   | Vehículos      | Contratos        |
      | standard   | Conductores    | Mantenimiento    |
      | standard   | Notificaciones | Facturación      |

  @smoke
  Esquema del escenario: Plan completo (Trial/Pro/Enterprise) habilita todos los módulos clave
    Dado que el admin cambia el plan del cliente demo a "<plan>"
    Cuando inicio sesión como "cliente"
    Entonces el sidebar contiene "<modulo>"

    Ejemplos: módulos visibles en planes completos
      | plan       | modulo       |
      | free_trial | Vehículos    |
      | free_trial | Contratos    |
      | free_trial | Facturación  |
      | free_trial | Reportes     |
      | pro        | Vehículos    |
      | pro        | Contratos    |
      | pro        | Facturación  |
      | enterprise | Vehículos    |

  @smoke
  Esquema del escenario: El límite de vehículos del plan se aplica visualmente
    Dado que el admin cambia el plan del cliente demo a "<plan>"
    Cuando inicio sesión como "cliente"
    Y visito "/vehicles"
    Entonces veo el texto "<resultado>"

    Ejemplos: comportamiento del banner de límite
      | plan       | resultado            |
      | free_trial | están bloqueados     |
      | pro        | de 100 vehículos     |
