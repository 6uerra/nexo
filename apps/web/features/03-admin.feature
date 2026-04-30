# language: es
@regression @admin
Característica: Vista de Admin
  Como Admin de Nexo
  Quiero gestionar mis clientes desde un panel claro

  Antecedentes:
    Dado estoy autenticado como "admin"

  @smoke
  Escenario: La lista de clientes muestra la Empresa Demo y un botón Ver detalle
    Cuando visito "/admin/clients"
    Entonces veo el texto "Empresa Demo"
    Y veo el texto "Ver detalle"

  Escenario: El detalle del cliente muestra los paneles de plan y suscripción
    Cuando visito "/admin/clients" y entro al detalle del cliente demo
    Entonces veo el texto "Cambiar plan"
    Y veo el texto "Probar estados de suscripción"

  Esquema del escenario: Los nombres de módulos aparecen en español
    Cuando visito "/admin/clients" y entro al detalle del cliente demo
    Entonces veo el texto "<modulo>"

    Ejemplos: módulos en español
      | modulo        |
      | Vehículos     |
      | Conductores   |
      | Propietarios  |
      | Mantenimiento |
      | Facturación   |

  Escenario: La lista de Planes está disponible y muestra los planes principales
    Cuando visito "/admin/plans"
    Entonces veo el texto "Standard"
    Y veo el texto "Enterprise"

  Escenario: El admin no ve módulos de cliente en su sidebar
    Entonces el sidebar contiene "Clientes"
    Y el sidebar contiene "Planes"
    Y el sidebar NO contiene "Vehículos"
    Y el sidebar NO contiene "Conductores"
