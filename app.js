const API = location.protocol === "file:"
    ? "http://localhost:3000/terminos"
    : "/terminos";

let terminos = [];
let idEditando = null;


// Elementos del HTML
const lista = document.getElementById("lista-terminos");
const plantilla = document.getElementById("plantilla-tarjeta");
const buscador = document.getElementById("buscador");
const contador = document.getElementById("contador");
const sinResultados = document.getElementById("sin-resultados");

const filtros = document.getElementById("filtros");

const formulario = document.getElementById("formulario");
const errorFormulario = document.getElementById("error-formulario");

const tituloFormulario = document.getElementById("titulo-formulario");
const btnNuevo = document.getElementById("btn-nuevo");
const btnCancelar = document.getElementById("btn-cancelar");


// ======================================================
// CARGAR LOS TÉRMINOS
// ======================================================

async function cargarTerminos() {

    try {
        const respuesta = await fetch(API);

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        terminos = await respuesta.json();
        mostrar();

    } catch (error) {
        console.error("No se pudieron cargar los términos:", error);
        contador.textContent = "Inicia el servidor con npm start para ver el glosario.";
        lista.innerHTML = "";
        sinResultados.hidden = false;
        sinResultados.textContent = "No se pudo cargar el glosario. Inicia el servidor.";
    }
}


// ======================================================
// CREAR UNA TARJETA
// ======================================================

function crearTarjeta(t) {

    const copia = plantilla.content.cloneNode(true);

    const tarjeta = copia.querySelector(".tarjeta");

    tarjeta.classList.add(t.categoria.toLowerCase());

    tarjeta.dataset.id = t.id;

    tarjeta.querySelector("h2").textContent = t.termino;

    tarjeta.querySelector(".categoria").textContent =
        t.categoria;

    tarjeta.querySelector(".definicion").textContent =
        t.definicion;

    tarjeta.querySelector(".ejemplo").textContent =
        t.ejemplo;

    return copia;
}


// ======================================================
// MOSTRAR Y FILTRAR LOS TÉRMINOS
// ======================================================

function mostrar() {

    // Texto escrito en el buscador
    const texto = buscador.value.toLowerCase();


    // Categoría seleccionada
    const categoria =
        filtros.querySelector("input:checked").value;


    // Filtrar por texto y categoría
    const filtrados = terminos.filter(t =>

        (
            t.termino.toLowerCase().includes(texto) ||

            t.definicion.toLowerCase().includes(texto)
        )

        &&

        (
            categoria === "Todos" ||

            t.categoria === categoria
        )
    );


    // Limpiar la lista
    lista.innerHTML = "";


    // Dibujar solamente los filtrados
    filtrados.forEach(t => {

        lista.appendChild(
            crearTarjeta(t)
        );

    });


    // Actualizar contador
    contador.textContent =
        `Mostrando ${filtrados.length} de ${terminos.length} términos`;


    // Mostrar mensaje si no hay resultados
    sinResultados.hidden =
        filtrados.length > 0;
}


// ======================================================
// BUSCADOR
// ======================================================

buscador.addEventListener("input", mostrar);


// ======================================================
// FILTROS POR CATEGORÍA
// ======================================================

filtros.addEventListener("change", mostrar);


// ======================================================
// BOTÓN "+ NUEVO TÉRMINO"
// ======================================================

btnNuevo.addEventListener("click", () => {

    // Indica que estamos creando
    idEditando = null;

    // Limpiar formulario
    formulario.reset();

    // Cambiar título
    tituloFormulario.textContent =
        "Nuevo término";

    // Limpiar mensaje de error
    errorFormulario.textContent = "";

    // Mostrar formulario
    formulario.hidden = false;
});


// ======================================================
// BOTÓN CANCELAR
// ======================================================

btnCancelar.addEventListener("click", () => {

    // Ocultar formulario
    formulario.hidden = true;

    // Volver al modo crear
    idEditando = null;

    // Limpiar formulario
    formulario.reset();

    // Limpiar error
    errorFormulario.textContent = "";
});


// ======================================================
// AGREGAR O EDITAR UN TÉRMINO
// ======================================================

formulario.addEventListener("submit", async function(e) {

    // Evitar que la página se recargue
    e.preventDefault();


    // Leer todos los campos del formulario
    const datos = Object.fromEntries(
        new FormData(formulario)
    );


    // Comprobar si el término ya existe
    // Ignorando el término que estamos editando
    const repetido = terminos.some(t =>

        t.termino.toLowerCase() ===
        datos.termino.toLowerCase()

        &&

        t.id !== idEditando
    );


    // Si está repetido
    if (repetido) {

        errorFormulario.textContent =
            "Ese término ya existe.";

        return;
    }


    // Decidir dirección
    // Si estamos editando: /terminos/id
    // Si estamos creando: /terminos
    const url = idEditando
        ? `${API}/${idEditando}`
        : API;


    // Decidir método
    // Editar = PUT
    // Crear = POST
    const metodo = idEditando
        ? "PUT"
        : "POST";


    // Enviar al servidor
    await fetch(url, {

        method: metodo,

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(datos)
    });


    // Ocultar formulario
    formulario.hidden = true;


    // Volver al modo crear
    idEditando = null;


    // Limpiar formulario
    formulario.reset();


    // Limpiar error
    errorFormulario.textContent = "";


    // Actualizar lista
    await cargarTerminos();
});


// ======================================================
// EDITAR Y ELIMINAR
// DELEGACIÓN DE EVENTOS
// ======================================================

lista.addEventListener("click", async (e) => {

    // Buscar la tarjeta donde se hizo clic
    const tarjeta = e.target.closest(".tarjeta");


    // Si no se hizo clic en una tarjeta
    if (!tarjeta) return;


    // Obtener ID de la tarjeta
    const id = tarjeta.dataset.id;


    // Buscar el término
    const termino = terminos.find(
        t => t.id === id
    );


    // Si no existe el término
    if (!termino) return;


    // ==================================================
    // EDITAR TÉRMINO
    // ==================================================

    if (e.target.matches(".btn-editar")) {

        // Guardar el ID que estamos editando
        idEditando = termino.id;


        // Cambiar título del formulario
        tituloFormulario.textContent =
            "Editar término";


        // Colocar los datos en el formulario
        formulario.termino.value =
            termino.termino;

        formulario.categoria.value =
            termino.categoria;

        formulario.definicion.value =
            termino.definicion;

        formulario.ejemplo.value =
            termino.ejemplo;


        // Mostrar formulario
        formulario.hidden = false;


        // Limpiar mensaje de error
        errorFormulario.textContent = "";

        return;
    }

    // ELIMINAR TÉRMINO

    if (
        e.target.matches(".btn-eliminar") &&

        confirm(
            `¿Eliminar "${termino.termino}"?`
        )
    ) {

        // Eliminar del servidor
        await fetch(`${API}/${id}`, {
            method: "DELETE"
        });


        // Actualizar la lista
        await cargarTerminos();
    }

});

// INICIAR EL PROGRAMA
cargarTerminos();