// Buscamos el icono azul en la página
const icono = document.querySelector(".icono-azul");

// Creamos el sonido (el archivo debe estar en la misma carpeta)
const sonido = new Audio("alarma.wav");
sonido.loop = true; // se repite mientras el mouse esté encima

// Reproduce el sonido desde el inicio
async function reproducir() {
  sonido.currentTime = 0;
  try {
    await sonido.play();
  } catch (error) {
    console.warn("El navegador bloqueó el audio. Haz clic en la página primero.", error);
  }
}

// Detiene el sonido
function detener() {
  sonido.pause();
  sonido.currentTime = 0;
}

// Mouse encima del icono -> suena
icono.addEventListener("mouseenter", reproducir);

// Mouse sale del icono -> se detiene
icono.addEventListener("mouseleave", detener);

// En celulares no existe "hover": un toque activa/desactiva el sonido
icono.addEventListener("click", () => {
  sonido.paused ? reproducir() : detener();
});