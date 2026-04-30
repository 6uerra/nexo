# language: es
@regression @e2e @subscription
Característica: Estados de suscripción y bloqueo
  Como Admin
  Quiero validar el comportamiento del cliente en cada estado de suscripción

  @smoke
  Escenario: Estado past_due muestra banner de aviso persistente
    Dado que el admin cambia la suscripción del cliente demo a "past_due"
    Cuando inicio sesión como "cliente"
    Entonces veo el texto "Suscripción vencida"
    Cuando visito "/vehicles"
    Entonces veo el texto "Suscripción vencida"

  @smoke @critical
  Esquema del escenario: Cuando bloqueado, las rutas operativas redirigen a /blocked
    Dado que el admin cambia la suscripción del cliente demo a "blocked"
    Cuando inicio sesión como "cliente"
    Y visito "<ruta>"
    Entonces estoy en la URL "/blocked"

    Ejemplos: rutas bloqueadas
      | ruta                  |
      | /dashboard            |
      | /vehicles             |
      | /drivers              |
      | /owners               |
      | /clients              |
      | /contracts            |
      | /maintenance          |
      | /billing              |
      | /profile              |
      | /settings/modules     |
      | /notifications        |

  @critical
  Escenario: Cliente bloqueado SÍ puede acceder a /settings/subscription
    Dado que el admin cambia la suscripción del cliente demo a "blocked"
    Cuando inicio sesión como "cliente"
    Y visito "/settings/subscription"
    Entonces estoy en la URL "/settings/subscription"
    Y NO veo el sidebar de operación

  Escenario: La página /blocked muestra los métodos de pago directamente
    Dado que el admin cambia la suscripción del cliente demo a "blocked"
    Cuando inicio sesión como "cliente"
    Y visito "/blocked"
    Entonces veo el texto "Tu acceso está bloqueado"
    Y veo el texto "Bancolombia"
