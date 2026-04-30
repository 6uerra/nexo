# language: es
@smoke @public
Característica: Páginas públicas
  Como visitante de Nexo
  Quiero conocer el producto sin necesidad de iniciar sesión

  Escenario: La landing muestra hero y planes
    Cuando visito la landing "/"
    Entonces veo el texto "vehículos"
    Y veo la sección de planes "#planes"

  Escenario: El roadmap es público
    Cuando visito "/roadmap"
    Entonces veo el título "Lo que viene en Nexo"
    Y veo el texto "Producción y operación"

  Escenario: El registro está cerrado y muestra invitación
    Cuando visito "/register"
    Entonces veo el texto "Acceso por invitación"

  Escenario: Login muestra los iconos de acceso rápido
    Cuando visito "/login"
    Entonces veo el botón "Entrar como Admin"
    Y veo el botón "Entrar como Cliente"
