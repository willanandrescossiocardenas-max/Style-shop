// ==========================================
// STYLE SHOP - SISTEMA COMPLETO
// ==========================================
const API_URL = "https://6b0106c91c637a569e52be97.mockapi.io/productos";
let productos = [];
let categoriaActual = "Todos";
let editandoId = null;
// ==========================================
// CONEXION CON MOCKAPI
// ==========================================
async function enviarPeticion(url, metodo = "GET", datos = null) {
   const opciones = {
       method: metodo,
       headers: {
           "Content-Type": "application/json"
       }
   };
   if (datos !== null) {
       opciones.body = JSON.stringify(datos);
   }
   const respuesta = await fetch(url, opciones);
   if (!respuesta.ok) {
       const mensaje = await respuesta.text();
       throw new Error("Error " + respuesta.status + ": " + mensaje);
   }
   if (respuesta.status === 204) return null;
   return await respuesta.json();
}
// ==========================================
// CARGAR PRODUCTOS
// ==========================================
async function cargarProductos() {
   const mensaje = document.getElementById("mensajeCarga");
   try {
       if (mensaje) mensaje.textContent = "Cargando productos...";
       productos = await enviarPeticion(API_URL);
       mostrarProductos();
       mostrarInventario();
       if (mensaje) {
           mensaje.textContent = productos.length + " productos disponibles";
       }
   } catch (error) {
       console.error(error);
       if (mensaje) mensaje.textContent = "Error al conectar con MockAPI";
       alert("No se pudieron cargar los productos. Revisa tu conexión.");
   }
}
// ==========================================
// MOSTRAR CATALOGO
// ==========================================
function mostrarProductos() {
   const lista = document.getElementById("listaProductos");
   const buscador = document.getElementById("buscador");
   if (!lista) return;
   const busqueda = buscador ? buscador.value.toLowerCase() : "";
   lista.innerHTML = "";
   const filtrados = productos.filter(p => {
       const nombre = (p.nombre || "").toLowerCase();
       const descripcion = (p.descripcion || "").toLowerCase();
       const coincideTexto =
           nombre.includes(busqueda) ||
           descripcion.includes(busqueda);
       const coincideCategoria =
           categoriaActual === "Todos" ||
           p.categoria === categoriaActual;
       return coincideTexto && coincideCategoria;
   });
   if (filtrados.length === 0) {
       lista.innerHTML = "<p>No se encontraron productos.</p>";
       return;
   }
   filtrados.forEach(p => {
       const tallas = (p.talla || "Unica")
           .split(",")
           .map(t => t.trim());
       const opciones = tallas.map(t =>
           `<option value="${t}">${t}</option>`
       ).join("");
       lista.innerHTML += `
<article class="producto">
<img
                   src="${p.imagen}"
                   alt="${p.nombre}"
                   onerror="this.src='https://placehold.co/600x800/222222/FFFFFF?text=STYLE+SHOP'"
>
<h3>${p.nombre}</h3>
<p>${p.descripcion || ""}</p>
<p class="precio">Bs ${Number(p.precio).toFixed(2)}</p>
<p>Stock disponible: ${p.stock}</p>
<label>Talla:</label>
<select
                   id="talla-${p.id}"
                   onchange="actualizarStockTalla('${p.id}')"
>
                   ${opciones}
</select>
<p id="disponible-${p.id}"></p>
<label>Cantidad:</label>
<input
                   type="number"
                   id="cantidad-${p.id}"
                   value="1"
                   min="1"
                   step="1"
>
<button onclick="comprar('${p.id}')">
                   COMPRAR
</button>
</article>
       `;
       actualizarStockTalla(p.id);
   });
}
// ==========================================
// BUSCADOR
// ==========================================
document.getElementById("buscador")?.addEventListener("input", mostrarProductos);
// ==========================================
// FILTROS DE CATEGORIA
// ==========================================
function filtrar(categoria) {
   categoriaActual = categoria;
   mostrarProductos();
}
// ==========================================
// ACTUALIZAR STOCK SEGUN TALLA
// ==========================================
function actualizarStockTalla(id) {
   const producto = productos.find(
       p => String(p.id) === String(id)
   );
   if (!producto) return;
   const selector = document.getElementById("talla-" + id);
   const mensaje = document.getElementById("disponible-" + id);
   if (!selector || !mensaje) return;
   const talla = selector.value;
   let disponible;
   if (talla === "Unica") {
       disponible = Number(producto.stock);
   } else {
       disponible = Number(producto["stock" + talla] || 0);
   }
   mensaje.textContent =
       "Disponibles en talla " + talla + ": " + disponible;
}
// ==========================================
// COMPRAR PRODUCTO
// ==========================================
async function comprar(id) {
   const producto = productos.find(
       p => String(p.id) === String(id)
   );
   if (!producto) {
       alert("Producto no encontrado");
       return;
   }
   const talla = document.getElementById("talla-" + id).value;
   const cantidad = Number(
       document.getElementById("cantidad-" + id).value
   );
   if (!Number.isInteger(cantidad) || cantidad < 1) {
       alert("Introduce una cantidad válida");
       return;
   }
   const disponible = talla === "Unica"
       ? Number(producto.stock)
       : Number(producto["stock" + talla] || 0);
   if (cantidad > disponible) {
       alert("No hay suficiente stock disponible");
       return;
   }
   const precioUnitario = Number(producto.precio);
   const total = precioUnitario * cantidad;
   const datos = { ...producto };
   if (talla === "Unica") {
       datos.stock = disponible - cantidad;
   } else {
       datos["stock" + talla] = disponible - cantidad;
       datos.stock =
           Number(producto.stock) - cantidad;
   }
   delete datos.id;
   try {
       await enviarPeticion(
           `${API_URL}/${id}`,
           "PUT",
           datos
       );
       mostrarComprobante(
           producto.nombre,
           precioUnitario,
           talla,
           cantidad,
           total
       );
       await cargarProductos();
   } catch (error) {
       console.error(error);
       alert("Error al realizar la compra: " + error.message);
   }
}
// ==========================================
// COMPROBANTE DE COMPRA
// ==========================================
function mostrarComprobante(nombre, precio, talla, cantidad, total) {
   let comprobante = document.getElementById("comprobante");
   if (!comprobante) {
       comprobante = document.createElement("div");
comprobante.id = "comprobante";
       document.body.appendChild(comprobante);
   }
   comprobante.style.cssText = `
       position: fixed;
       inset: 0;
       background: rgba(0,0,0,0.85);
       display: flex;
       justify-content: center;
       align-items: center;
       z-index: 99999;
       padding: 20px;
   `;
   comprobante.innerHTML = `
<div style="
           background:#171717;
           color:white;
           padding:30px;
           border-radius:15px;
           width:100%;
           max-width:420px;
           font-family:Arial;
           border:1px solid #bfff00;
       ">
<h2 style="text-align:center;color:#bfff00;">
               STYLE SHOP
</h2>
<h3 style="text-align:center;">
               COMPROBANTE DE COMPRA
</h3>
<hr>
<p><b>Producto:</b> ${nombre}</p>
<p><b>Talla:</b> ${talla}</p>
<p><b>Cantidad:</b> ${cantidad}</p>
<p><b>Precio unitario:</b> Bs ${precio.toFixed(2)}</p>
<hr>
<p><b>Subtotal:</b> Bs ${total.toFixed(2)}</p>
<h2 style="color:#bfff00;text-align:center;">
               TOTAL: Bs ${total.toFixed(2)}
</h2>
<p style="text-align:center;color:#bfff00;">
               ¡GRACIAS POR TU COMPRA!
</p>
<button
               onclick="document.getElementById('comprobante').remove()"
               style="
                   width:100%;
                   padding:14px;
                   background:#bfff00;
                   color:black;
                   border:none;
                   border-radius:8px;
                   font-weight:bold;
                   cursor:pointer;
               "
>
               CONTINUAR COMPRANDO
</button>
</div>
   `;
}
// ==========================================
// INICIAR SESION ADMINISTRADOR
// ==========================================
function iniciarSesion() {
   const usuario = document.getElementById("usuario").value;
   const password = document.getElementById("password").value;
   if (usuario === "admin" && password === "style123") {
       document.getElementById("login").style.display = "none";
       document.getElementById("panel").style.display = "block";
       mostrarInventario();
   } else {
       alert("Usuario o contraseña incorrectos");
   }
}
// ==========================================
// CERRAR SESION
// ==========================================
function cerrarSesion() {
   document.getElementById("login").style.display = "block";
   document.getElementById("panel").style.display = "none";
}
// ==========================================
// GUARDAR PRODUCTO NUEVO O EDITAR
// ==========================================
async function guardarProducto() {
   const nombre = document.getElementById("nombre").value.trim();
   const descripcion = document.getElementById("descripcion").value.trim();
   const precio = Number(document.getElementById("precio").value);
   const imagen = document.getElementById("imagen").value.trim();
   const categoria = document.getElementById("categoria").value;
   const tallaOriginal = document.getElementById("talla").value.trim();
   const talla = tallaOriginal.toUpperCase();
   const stock = Number(document.getElementById("stock").value);
   const stockS = Number(document.getElementById("stockS").value || 0);
   const stockM = Number(document.getElementById("stockM").value || 0);
   const stockL = Number(document.getElementById("stockL").value || 0);
   const stockXL = Number(document.getElementById("stockXL").value || 0);
   if (!nombre || !descripcion || !imagen || !tallaOriginal) {
       alert("Completa todos los campos");
       return;
   }
   if (!Number.isFinite(precio) || precio <= 0) {
       alert("Introduce un precio válido");
       return;
   }
   const cantidades = [stock, stockS, stockM, stockL, stockXL];
   if (cantidades.some(n => !Number.isInteger(n) || n < 0)) {
       alert("Los stocks deben ser números enteros y no negativos");
       return;
   }
   let datos = {};
   if (talla === "UNICA") {
       datos = {
           nombre,
           descripcion,
           precio,
           stock,
           imagen,
           categoria,
           talla: "Unica",
           stockS: 0,
           stockM: 0,
           stockL: 0,
           stockXL: 0
       };
   } else {
       const permitidas = ["S", "M", "L", "XL"];
       const tallasIngresadas = talla
           .split(",")
           .map(t => t.trim());
       if (
           tallasIngresadas.length === 0 ||
           tallasIngresadas.some(t => !permitidas.includes(t)) ||
           new Set(tallasIngresadas).size !== tallasIngresadas.length
       ) {
           alert("Escribe las tallas así: S,M,L,XL");
           return;
       }
       const stocks = {
           S: stockS,
           M: stockM,
           L: stockL,
           XL: stockXL
       };
       for (const t of permitidas) {
           if (!tallasIngresadas.includes(t) && stocks[t] !== 0) {
               alert("El stock de una talla no seleccionada debe ser 0");
               return;
           }
       }
       const total = tallasIngresadas.reduce(
           (suma, t) => suma + stocks[t],
           0
       );
       datos = {
           nombre,
           descripcion,
           precio,
           stock: total,
           imagen,
           categoria,
           talla: tallasIngresadas.join(","),
           stockS,
           stockM,
           stockL,
           stockXL
       };
   }
   try {
       let url = API_URL;
       let metodo = "POST";
       if (editandoId !== null) {
           url = `${API_URL}/${editandoId}`;
           metodo = "PUT";
       }
       await enviarPeticion(url, metodo, datos);
       alert(
           editandoId !== null
               ? "Producto actualizado correctamente"
               : "Producto agregado correctamente"
       );
       limpiarFormulario();
       await cargarProductos();
   } catch (error) {
       console.error(error);
       alert("Error al guardar el producto: " + error.message);
   }
}
// ==========================================
// MOSTRAR INVENTARIO ADMINISTRADOR
// ==========================================
function mostrarInventario() {
   const inventario = document.getElementById("inventario");
   if (!inventario) return;
   inventario.innerHTML = "";
   productos.forEach(p => {
       inventario.innerHTML += `
<div class="item-admin">
<h3>${p.nombre}</h3>
<p>Categoría: ${p.categoria}</p>
<p>Precio: Bs ${p.precio}</p>
<p>Stock total: ${p.stock}</p>
<p>Tallas: ${p.talla}</p>
<p>
                   S: ${p.stockS || 0} |
                   M: ${p.stockM || 0} |
                   L: ${p.stockL || 0} |
                   XL: ${p.stockXL || 0}
</p>
<button onclick="editarProducto('${p.id}')">
                   EDITAR
</button>
<button onclick="eliminarProducto('${p.id}')">
                   ELIMINAR
</button>
</div>
       `;
   });
}
// ==========================================
// EDITAR PRODUCTO
// ==========================================
function editarProducto(id) {
   const p = productos.find(
       x => String(x.id) === String(id)
   );
   if (!p) return;
   editandoId = id;
   document.getElementById("tituloFormulario").textContent = "Editar producto";
   document.getElementById("nombre").value = p.nombre;
   document.getElementById("descripcion").value = p.descripcion;
   document.getElementById("precio").value = p.precio;
   document.getElementById("imagen").value = p.imagen;
   document.getElementById("categoria").value = p.categoria;
   document.getElementById("talla").value = p.talla;
   document.getElementById("stock").value = p.stock;
   document.getElementById("stockS").value = p.stockS || 0;
   document.getElementById("stockM").value = p.stockM || 0;
   document.getElementById("stockL").value = p.stockL || 0;
   document.getElementById("stockXL").value = p.stockXL || 0;
   document.getElementById("tituloFormulario").scrollIntoView({
       behavior: "smooth"
   });
}
// ==========================================
// ELIMINAR PRODUCTO
// ==========================================
async function eliminarProducto(id) {
   const confirmar = confirm(
       "¿Seguro que deseas eliminar este producto?"
   );
   if (!confirmar) return;
   try {
       await enviarPeticion(
           `${API_URL}/${id}`,
           "DELETE"
       );
       alert("Producto eliminado correctamente");
       await cargarProductos();
   } catch (error) {
       console.error(error);
       alert("Error al eliminar: " + error.message);
   }
}
// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
function limpiarFormulario() {
   editandoId = null;
   document.getElementById("tituloFormulario").textContent = "Agregar producto";
   document.getElementById("nombre").value = "";
   document.getElementById("descripcion").value = "";
   document.getElementById("precio").value = "";
   document.getElementById("imagen").value = "";
   document.getElementById("categoria").value = "";
   document.getElementById("talla").value = "";
   document.getElementById("stock").value = "";
   document.getElementById("stockS").value = "";
   document.getElementById("stockM").value = "";
   document.getElementById("stockL").value = "";
   document.getElementById("stockXL").value = "";
}
// ==========================================
// INICIAR PAGINA
// ==========================================
cargarProductos();