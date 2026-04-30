# language: es
@regression @e2e @crud @sprint2
Característica: CRUD de activos operativos (Sprint 2)
  Como Cliente
  Quiero crear, editar y eliminar mis vehículos, conductores y propietarios
  Para mantener mi inventario actualizado

  Antecedentes:
    Dado que el cliente demo está en estado "active" con plan "free_trial"
    Y estoy autenticado como "cliente"

  @smoke @critical
  Escenario: Crear un nuevo propietario desde la UI
    Cuando visito "/owners"
    Y hago click en "Nuevo propietario"
    Y completo el campo "fullName" con "Pedro QA Test"
    Y completo el campo "document" con "1234567890"
    Y hago click en "Crear propietario"
    Entonces veo el texto "Pedro QA Test"

  @smoke @critical
  Escenario: Crear un nuevo conductor desde la UI
    Cuando visito "/drivers"
    Y hago click en "Nuevo conductor"
    Y completo el campo "fullName" con "Conductor QA"
    Y completo el campo "document" con "9876543210"
    Y hago click en "Crear conductor"
    Entonces veo el texto "Conductor QA"

  @smoke @critical
  Escenario: Crear un nuevo vehículo desde la UI
    Cuando visito "/vehicles"
    Y hago click en "Nuevo vehículo"
    Y completo el campo "plate" con "QAA-999"
    Y hago click en "Crear vehículo"
    Entonces veo el texto "QAA-999"
