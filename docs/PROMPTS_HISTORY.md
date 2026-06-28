# Historial de Prompts

## 1. Primer Prompt

Debes desarrollar una aplicación web app para la organización y gestion de torneos de arquería.

Debe estar pensada para verla desde un smartphone principalmente y se trata de una web app (pwa).

👉 Importante! 
Se trata de una aplicación que la van a utilizar pocas personas. Debe ser rápida y ágil para no entorpecer su uso durante los torneos que es lo fundamental.

👉 Contexto:
Se trata de una aplicación que permite a un usuario organizar pequeños torneos de arquería amistosos para practicar.

Debe poder organizar torneos de las 4 modalidades (sala, aire libre, juegos de campo y 3d) y para todas las categorías (compuesto, cazador, raso, recurvo olímpico, recurvo tradicional, longbow)

Debe respetar el reglamento de la WA (world Archery).

El usuario que esta usando la app debe poder crear un nuevo torneo, elegir la modalidad, elegir la cantidad de tiradas que se van a realizar, elegir la cantidad de participantes y la cantidad de flechas por tirada (por defecto vendrán seteadas la que corresponda con la modalidad elegida).

Una vez creado el torneo se irán cargando los puntajes por cada tirada (debe respetar el formato que usa la World Archery para anotar), una vez terminadas la totalidad de tiradas se da cierre al torneo y se muestran los resultados con el podio (1er, 2do y 3er lugar) y un listado con el resultado del resto de los participantes. Deben existir 3 podios, uno general (tiene en cuenta todos los participantes sin considerar su experiencia y categoría), otro por tipo de arco (categoria) y uno general para escuela (sin discriminar por categoria)

La aplicación debe darle estadística útiles sobre el desempeño de cada arquero en el torneo al finalizar.

Como la app busca ser simple, no es necesario que cada participante quede registrado en la app. Al momento de crear un torneo se crean Avatars para cada participante (estos quedan guardados para reutilizarlos luego).

Cada avatar debe tener estos datos:
- categoria: Compuesto, Cazador, Raso, Recurvo Olimpico, Recuervo Tradicional, Longbow.
- Alias
- Color
- experiencia: Escuela, senior (senior por defecto)

Una vez se crea el torneo se deben distribuir a los arqueros en pares y asignarles una estaca (roja, amarilla o azul) dependiendo de la distancia a la que tienen que tirar. (Revisar reglamento de la World Archery). Se deben armar los pares por estaca siempre que sea posible.

Los torneos ya finalizados se pueden volver a ingresar desde la home para revisar las estadística y el podio.

👉 Sobre la app:
La app contará con varias páginas:
- página de inicio
- página de creación de cuenta
- página principal (home)
- página de creación de torneo
- página de Torneo 
- página de tirada
- página de estadísticas del torneo
- página de estadísticas del participante
- página de podios
- página de creación de avatar

Algunas conceptos claves:
Le llamaremos "tirada" a cada vez que los participantes tiran una serie de flechas y anota sus puntajes.

🟡 Página de inicio y registro:
La app debe permitir crear una cuenta solo ingresando un alias y un password. (En una segunda instancia se utilizará algún Servicio de autenticación)
Reutiliza el login y registro actual que usa BV-cross y BV-bow-sight

🟡 Página principal:
Una vez ingresado a la app el arquero debe poder ver los torneos en curso y los finalizados y acceder a ellos. 

Desde esta página debe poder navegar a la página de creación de avatars y a la pagina de creación de torneo.

🟡 Página de creación de avatar:
Para crear un nuevo avatar se deben cargar los siguientes campos:
- alias* (texto)
- arco* (compuesto, cazador, raso, recurvo olímpico, recurvo tradicional, longbow) (selector) (estos deben estar guardados en la BD) 
- color (selector) (tener al menos 10 variantes)
- principiante (checkbox) (define si ese avatar es escuela o no), por defecto esta desactivado 

🟡 Página de creación de Torneos:
Para crear un nuevo torneo se deben cargar los siguientes campos:
- nombre del torneo* (texto)
- modalidad* (sala, aire libre, juegos de campo y 3d) (selector) (estos deben estar guardados en la BD)
- tiradas* (number) (por defecto 10)
- flechas* (number) (por defecto la que corresponda con la modalidad, sala y juego de campo 3 flechas, aire libre 6 flechas, 3d 2 flechas)
- participantes (permite agregar avatars cargados o acceder a cargar uno nuevo, para no salir interrumpir la creación del torneo)

🟡 Página de torneo 
En esta página se muestran listadas todas las tiradas que corresponden al torneo, a las cuales se pueden acceder, deben mostrar si ya están completas o no, deben poder permitir editarlas en caso de necesitar cambiar algo. Tambien debe mostrar los 3 participantes que vienen en el podio en la general y en la de cada categoría. Una vez todas las tiradas fueron completadas se permite acceder a la pagina de podios.

🟡 Página de tirada:
En esta página se permiten cargar los puntajes de cada participante, se deben mostrar ordenados en pares y con el color de estaca que corresponda para de esa forma saber el orden y la distancia a la que deben tirar cada uno. Una vez estén cargados los puntajes de todos la tirada pasa a estado finalizado y se habilita la próxima.

Ir guardando los datos a medida que se cargan. El formato de carga de los puntajes debe respetar las reglas de la World Archery.

🟡 Página de Podio:
En esta pagina se muestran los podios (el general, el por categoría y el de escuela) en cada uno se muestra el listado de todos los participantes por puntaje resaltando al 1er, 2do y 3er puesto. 

🟡 Página de estadísticas del torneo:
En esta pagina se muestran las estadísticas generales del torneo, cantidad de M, cantidad de X, puntaje promedio general y por categoría, mejor puntaje general y por categoría y cualquier otro tipo de información que puede ser relevante.

🟡 Página de estadísticas de participante:
En esta pagina se muestran las estadísticas generales del participante en ese torneo, cantidad de M, cantidad de X, puntaje promedio, mejor puntaje y cualquier otro tipo de información que puede ser relevante.

👉 Stack tecnológico
Deben usar tecnologías web modernas y confiables.
- Para el frontend usar React.
- Para el backend usar node.
- Base de datos simple, como SQLite.

Se debe poder desplegar en cualquiera de los servicios de hosting más utilizados por la comunidad que tengan precios bajos. Se debe priorizar el costo.

👉 Arquitectura:
- Debe ser simple pero solida, puede ser monolítica. Debe permitir a futuro separar FE y BE en diferentes repos si se ve la necesidad de escalarla.

👉 UI:
Debe tener un diseño elegante y moderno. Debe verse claro y debe estar optimizado para verse en dispositivos móviles.
Debe tener tema oscuro y claro.
Debe permitir cambiar el color base de la app como en bv-cross y bv-bow-sight

👉 Skills:
Haz uso de Skills de la comunidad para optimizar el desarrollo y seguir las mejores prácticas. (hacer uso de las skills instaladas)

👉 Seguridad: 
Debe seguir las mejores prácticas de seguridad para evitar cualquier tipo de ataque.

👉 Tests:
Crea una batería de tests suficientes para validar las funcionalidades de la aplicación.

👉 Importante!!! Pasos a seguir:
- Crea un análisis completo de los requerimientos.
- Crea una plan de acción bien detallado con los pasos a seguir para que otros modelos de IA puedan seguirlos correctamente. No debes arrancar a desarrollarla, tu tarea es desarrollar todo el plan funcional y técnico, la arquitectura y el plan de acción y las tareas para que otros modelos puedan desarrollar los siguiendo los consejos y definiciones que generes.
- Separa el plan de desarrollo en Front y Back.
- Cada plan debe estar organizado en pequeñas tareas organizadas por prioridad.
- La performance y la seguridad no son negociables, deben respetarse.
- Crea archivos de documentación que sirvan de contexto.

👉 Documentos a generar:
- archivo de documentación funcional
- archivo de documentación técnica 
- archivo de documentación de arquitectura 
- archivo de documentación de configuraciones
- archivo de plan de acción con las tareas y el paso a paso para su desarrollo (Front y BE).
- puedes sumar más archivos de documentación si lo ves necesario.

👉 Investigación:
- Investiga en internet sobre otras apps similares y sobre los reglamentos de la World Archery para ayudarte en el análisis.

👉 Preguntas
Si tienes preguntas sobre los requerimientos, sobre la app, sobre las funcionalidades o sobre cualquier tema relacionado házmela 

Puedes dar inicio al desarrollo del plan.

--------------------------------------------------------------------------

## 2. Primer Prompt para el cambio de UI

Actualización de la UI.

1. se debe mejorar el diseño general de la UI, hay un archivo DESIGN_GUIDE para implementar un diseño mas moderno similar al que usa actualmente Claude.

2. cambios puntuales de la UI:
- El botón para cambiar de tema (light/dark) debe cambiar de un emoji a un icono. (utilizar un plantilla de iconos para la aplicación)
- El cerrar session debe ser un icono en el header.
- El botón "Nuevo Avatar" en la Home debe cambiar por Avatares, dentro se debe mostrar el listado de "Mis avatares" y el botón de "Nuevo Avatar". No se debe mostrar el listado de avatares en la Home. Seria la pagina Gestionar.
- La app debe tener un color de acento y debe poder cambiarse desde el header (como lo hace bv-coss y bv-bow-sight).
- Crea iconografía para cada categoría de arco, (Ejemplo: Una polea para los compuestos, una mira de 3 pines para cazador, una flecha para los rasos, el símbolo de las olimpiadas para los olímpicos, un arco recurvo para los tradicionaes, y un arco largo para los longbow. (La idea es que cada Avatar tenga una imagen, la imagen sera el icono de la categoría seleccionada con el fondo del color seleccionado, ej: si selecciono Categoria Compuesto y color Rojo, el icono de ese avatar sera una polea blanca en un fondo rojo).

## 3. Prompt para Torneos

Cambios de UI y funcional de los Torneos:

- Permite editar un torneo en curso.
- Puedes agregar participantes, los participantes deberán realizar las tiradas que ya fueron completadas por los participantes anteriores.
- No puede existir pares de mas de 2, si es un numero impar uno de los arqueros tira solo.
- Al terminar la ultima tirada debe dar la posibilidad de agregar una nueva tirada (para el caso de querer continuar el torneo con mas blancos) o finalizarlo.
- La sección de podios debe aparecer luego de completar la primera tirada, el podio debe mostrar los primeros 3 pero debe poder ampliarlo para ver todos. Tambien debe poder por medio de un carousel ver los otros podios (general, por categoría y escuela)
- Cuando un tirada ya tiene datos cargados y se vuelve a la pagina del torneo debe mostrar la etiqueta de en proceso.
- Cuando se cambia el numero de tiradas o flechas si se limpia el campo se autosetea en 0, eso puede ser molesto, deja que quede vacío y que muestre un error cuando se intenta crear un torneo sin completarlos.
- En la pagina de tirada mostrar al lado de cada texto "Par X" agregar las categorías de cada participante (Ej Par 1 - Compuesto | Cazador)

## 4. Cambios en UI varios

Cambios en la UI:

Generales:
- [] Cambia la paleta de color Dark y la de color Light, usa la misma que Claude.
- [] Cambia la tipografía y usa una similar a Claude.
- [] En cada botón agrega un icono representativo.
- [] Agrega en el fondo un efecto de puntillismo con tonalidad apenas mas oscura que el fondo, que pase casi desapercibido  
- [] usa el icono svg que se encuentra en web/public y úsalo en la app.

Svg:
- [] Modifica los iconos para cada categoría, 
	- cazador ✅
	- compuesto 👉 cambiar a una mira de un solo pin vertical
	- raso 👉 cambiar por una flecha con Vanes
	- olímpico 👉 cambiar por un icono de las 3 barras características que usan
	- 👉 recurvo modifica el arco para que sus palas estén mas curvadas y se diferencien del longbow
	- longbow ✅

Header:
- [] El selector de color de acento en el hacer se ve de forma incorrecta (todos los colores solapados), cambia a selección vertical.
- [] Cambia el botón de volver atrás para que tenga el mismo diseño que los otros del header.
- [] Agregar una forma de volver a la Home en todas las paginas.

Avatares:
- [] En la pagina /avatars cambia el "editar", "restaurar" y el "archivar" por iconografía, colócalos dentro de la card, no por fuera
- [] Cambia el checkbox por un diseño mas moderno.

Nuevo Torneo:
- [] Cambia nombre por Nombre del torneo
- [] Cambia el valor de Tiradas por defecto de 10 a 5
- [] Cambia el listado de participantes, que se muestren como máximo 5 y luego se tenga un scroll.

Torneo:
- [] Cambiar el Editar nombre, Agregar participante y Estadísticas por solo iconografía.
- [] El botón agregar tirada debe ir al final del listado de tiradas.


## 5. Cambios en la UI varios.

implementa las siguientes modificaciones. 

* pagina LOGIN - Agrega el icono de la app en la pagina de Login, centrado en la parte superior.
* pagina NUEVO TORNEO - coloca como valor de defecto en el campo "tiradas" la cantidad de tiradas que tienen cada modalidad de torneo según la World Archery. Ejemplo: 3D: 24, Juegos de campo: 24, etc
* pagina NUEVO TORNEO -  agrega iconografia al inicio de cada botón de modalidad de torneo, selecciona iconografía que se relacione con la modalidad o crea svg.
* Se debe mostrar la fecha de creacion del torneo, tanto en la pagina INICIO como en la pagina TORNEO
* pagina PODIOS - se deben mostrar los podios uno debajo de otro y no como un carousel.

Agrega la iconofragia svg que usaste para cada modalidad. Agregala en los torneos, en la pagina de inicio agregala adelante del nombre y en la pagina de torneo agregala delante de la cantidad de arqueros - estado y fecha (que ocupe la misma altura que los botones)

