 // Función para copiar el detalle al portapapeles
 export const copiarAlPortapapeles = (text:string) => {
    if (text) {
      navigator.clipboard.writeText(text)
        .then(() => alert('Texto copiado al portapapeles'))
        .catch((err) => console.error('Error al copiar el texto: ', err));
    }
  };