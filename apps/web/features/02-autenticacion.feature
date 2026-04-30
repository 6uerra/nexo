# language: es
@smoke @auth
Característica: Autenticación de usuarios
  Como usuario de Nexo
  Quiero iniciar y cerrar sesión correctamente

  Esquema del escenario: Login redirige según el rol del usuario
    Cuando inicio sesión como "<rol>"
    Entonces estoy en la URL "<destino>"

    Ejemplos: redirecciones por rol
      | rol     | destino         |
      | admin   | /admin/clients  |
      | cliente | /dashboard      |

  Escenario: Credenciales inválidas muestran error
    Cuando visito "/login"
    Y completo el campo "email" con "no@existe.com"
    Y completo el campo "password" con "incorrecta"
    Y hago click en "Ingresar"
    Entonces veo el mensaje "Credenciales inválidas"

  @critical
  Escenario: El cliente puede cerrar sesión
    Dado estoy autenticado como "cliente"
    Cuando hago click en "Cerrar sesión"
    Entonces estoy en la URL "/"
